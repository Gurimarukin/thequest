/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { monoid, number, random, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import React, { useCallback, useEffect, useMemo } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../../shared/models/api/Platform'
import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { Dict } from '../../../shared/utils/fp'
import { Future, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { apiUserSelfSummonerChampionShardsCountPut } from '../../api'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useUser } from '../../contexts/UserContext'
import { usePrevious } from '../../hooks/usePrevious'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { useSummonerNameFromLocation } from '../../hooks/useSummonerNameFromLocation'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import type { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { Masteries } from './Masteries'
import type { EnrichedSummonerView } from './Summoner'
import { Summoner } from './Summoner'

type Props = {
  readonly platform: Platform
  readonly summonerName: string
}

export const SummonerMasteries = ({ platform, summonerName }: Props): JSX.Element => {
  const { user } = useUser()

  const { data, error, mutate } = useSWRHttp(
    apiRoutes.platform.summoner.byName.get(platform, clearSummonerName(summonerName)),
    {},
    [SummonerMasteriesView.codec, 'SummonerMasteriesView'],
  )

  // Remove shards on user disconnect
  const previousUser = usePrevious(user)
  useEffect(() => {
    if (data !== undefined && Maybe.isNone(user) && Maybe.isSome(Maybe.flatten(previousUser))) {
      mutate({ ...data, championShards: Maybe.none }, { revalidate: false })
    }
  }, [data, mutate, previousUser, user])

  const setChampionShards = useCallback(
    (champion: ChampionKey) =>
      (count: number): void => {
        if (data === undefined) return
        return pipe(
          data.championShards,
          Maybe.fold(
            () => undefined,
            previousChampionShards => {
              mutate(
                {
                  ...data,
                  championShards: Maybe.some({
                    ...previousChampionShards,
                    [ChampionKey.unwrap(champion)]: count,
                  }),
                },
                { revalidate: false },
              )
              pipe(
                apiUserSelfSummonerChampionShardsCountPut(data.summoner.id, champion, count),
                // TODO: sucess toaster
                // Future.map(() => {}),
                Future.orElseW(() => {
                  mutate(data, { revalidate: false })
                  // TODO: error toaster
                  alert('Erreur lors de la modification des fragments')
                  return Future.right<void>(undefined)
                }),
                futureRunUnsafe,
              )
            },
          ),
        )
      },
    [data, mutate],
  )

  return (
    <MainLayout>
      {basicAsyncRenderer({ data, error })(({ summoner, masteries, championShards }) => (
        <SummonerViewComponent
          platform={platform}
          summoner={summoner}
          masteries={masteries}
          championShards={championShards}
          setChampionShards={setChampionShards}
        />
      ))}
    </MainLayout>
  )
}

const whiteSpaces = /\s+/g
const clearSummonerName = (name: string): string => name.toLowerCase().replaceAll(whiteSpaces, '')

type SummonerViewProps = {
  readonly platform: Platform
  readonly summoner: SummonerView
  readonly masteries: List<ChampionMasteryView>
  readonly championShards: Maybe<Dict<string, number>>
  readonly setChampionShards: (champion: ChampionKey) => (count: number) => void
}

const SummonerViewComponent = ({
  platform,
  summoner,
  masteries,
  championShards,
  setChampionShards,
}: SummonerViewProps): JSX.Element => {
  const { navigate, masteriesQuery } = useHistory()
  const { addRecentSearch } = useUser()
  const staticData = useStaticData()

  useEffect(
    () =>
      addRecentSearch({
        platform,
        name: summoner.name,
        profileIconId: summoner.profileIconId,
      }),
    [addRecentSearch, platform, summoner.name, summoner.profileIconId],
  )

  const summonerNameFromLocation = useSummonerNameFromLocation()
  // Correct case of summoner's name in url
  useEffect(
    () =>
      navigate(
        appRoutes.platformSummonerName(
          platform,
          summoner.name,
          MasteriesQuery.toPartial(masteriesQuery),
        ),
        { replace: true },
      ),
    [summonerNameFromLocation, masteriesQuery, navigate, platform, summoner.name],
  )

  const { enrichedSummoner, enrichedMasteries } = useMemo(
    () => enrichAll(masteries, masteriesQuery.view, staticData.champions),
    [masteries, masteriesQuery.view, staticData.champions],
  )

  return (
    <div className="flex flex-col p-2">
      <Summoner summoner={{ ...summoner, ...enrichedSummoner }} />
      <Masteries
        masteries={enrichedMasteries}
        championShards={championShards}
        setChampionShards={setChampionShards}
      />
    </div>
  )
}

type EnrichedAll = {
  readonly enrichedSummoner: Omit<EnrichedSummonerView, keyof SummonerView>
  readonly enrichedMasteries: List<EnrichedChampionMastery>
}

type PartialMasteriesGrouped = Partial<
  Dict<`${ChampionLevelOrZero}`, NonEmptyArray<EnrichedChampionMastery>>
>

const enrichAll = (
  masteries: List<ChampionMasteryView>,
  view: MasteriesQueryView,
  staticDataChampions: List<StaticDataChampion>,
): EnrichedAll => {
  const enrichedMasteries_ = pipe(
    staticDataChampions,
    List.map(({ key, name }): EnrichedChampionMastery => {
      // TODO: search
      const glow =
        view === 'compact' &&
        List.elem(string.Eq)(name, ['Renekton', 'Twitch', 'Vayne', 'LeBlanc', 'Pyke'])
          ? Maybe.some(random.random())
          : Maybe.none
      return pipe(
        masteries,
        List.findFirst(c => c.championId === key),
        Maybe.fold(
          (): EnrichedChampionMastery => ({
            championId: key,
            championLevel: 0,
            championPoints: 0,
            championPointsSinceLastLevel: 0,
            championPointsUntilNextLevel: 0,
            chestGranted: false,
            tokensEarned: 0,
            name,
            percents: 0,
            glow,
          }),
          champion => ({ ...champion, name, percents: championPercents(champion), glow }),
        ),
      )
    }),
  )
  const totalChampionsCount = enrichedMasteries_.length
  const questPercents =
    pipe(
      enrichedMasteries_,
      List.map(c => c.percents),
      monoid.concatAll(number.MonoidSum),
    ) / totalChampionsCount
  const totalMasteryLevel = pipe(
    enrichedMasteries_,
    List.map(c => c.championLevel),
    monoid.concatAll(number.MonoidSum),
  )

  const grouped: PartialMasteriesGrouped = pipe(
    enrichedMasteries_,
    NonEmptyArray.fromReadonlyArray,
    Maybe.map(List.groupBy(c => ChampionLevelOrZero.stringify(c.championLevel))),
    Maybe.getOrElse(() => ({})),
  )
  const masteriesCount = pipe(
    ChampionLevelOrZero.values,
    List.reduce({} as Dict<`${ChampionLevelOrZero}`, number>, (acc, key) => {
      const value: number = grouped[key]?.length ?? 0
      return { ...acc, [key]: value }
    }),
  )
  return {
    enrichedSummoner: {
      questPercents,
      // totalChampionsCount,
      totalMasteryLevel,
      masteriesCount,
    },
    enrichedMasteries: enrichedMasteries_,
  }
}

// Mastery 5: 50%
// Mastery 6 tokens: 7% each
// Mastery 7 tokens: 10% each
// Shards (not based on user's favorites): 3% each
const championPercents = (c: ChampionMasteryView): number => {
  if (c.championLevel === 7) return 100

  // 6-0: 67%, 6-1: 77%, 6-2: 87%, 6-3: 97%
  if (c.championLevel === 6) return 67 + c.tokensEarned * 10

  // 5-0: 50%, 5-1: 57%, 5-2: 64%
  if (c.championLevel === 5) return 50 + c.tokensEarned * 7

  return (c.championPoints / 21600) * 50
}
