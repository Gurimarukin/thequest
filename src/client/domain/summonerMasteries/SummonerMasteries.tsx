import { monoid, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import React, { useEffect, useMemo } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../../shared/models/api/Platform'
import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { Dict } from '../../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/MainLayout'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useUser } from '../../contexts/UserContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { useSummonerNameFromLocation } from '../../hooks/useSummonerNameFromLocation'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import type { EnrichedChampionMasteryView } from './Masteries'
import { Masteries } from './Masteries'
import type { EnrichedSummonerView } from './Summoner'
import { Summoner } from './Summoner'

type Props = {
  readonly platform: Platform
  readonly summonerName: string
}

export const SummonerMasteries = ({ platform, summonerName }: Props): JSX.Element => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(
        apiRoutes.platform.summoner.byName.get(platform, clearSummonerName(summonerName)),
        {},
        [SummonerMasteriesView.codec, 'SummonerView'],
      ),
    )(({ summoner, masteries }) => (
      <SummonerViewComponent platform={platform} summoner={summoner} masteries={masteries} />
    ))}
  </MainLayout>
)

const whiteSpaces = /\s+/g
const clearSummonerName = (name: string): string => name.toLowerCase().replaceAll(whiteSpaces, '')

type SummonerViewProps = {
  readonly platform: Platform
  readonly summoner: SummonerView
  readonly masteries: List<ChampionMasteryView>
}

const SummonerViewComponent = ({
  platform,
  summoner,
  masteries,
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
    () => enrichAll(masteries, staticData.champions),
    [masteries, staticData.champions],
  )

  return (
    <div className="p-2 flex flex-col">
      <Summoner summoner={{ ...summoner, ...enrichedSummoner }} />
      <Masteries masteries={enrichedMasteries} />
    </div>
  )
}

type EnrichedAll = {
  readonly enrichedSummoner: Omit<EnrichedSummonerView, keyof SummonerView>
  readonly enrichedMasteries: List<EnrichedChampionMasteryView>
}

type PartialMasteriesGrouped = Partial<
  Dict<`${ChampionLevelOrZero}`, NonEmptyArray<EnrichedChampionMasteryView>>
>

const enrichAll = (
  masteries: List<ChampionMasteryView>,
  staticDataChampions: List<StaticDataChampion>,
): EnrichedAll => {
  const enrichedMasteries_ = pipe(
    staticDataChampions,
    List.map(
      ({ key, name }): EnrichedChampionMasteryView =>
        pipe(
          masteries,
          List.findFirst(c => c.championId === key),
          Maybe.fold(
            (): EnrichedChampionMasteryView => ({
              championId: key,
              championLevel: 0,
              championPoints: 0,
              championPointsSinceLastLevel: 0,
              championPointsUntilNextLevel: 0,
              chestGranted: false,
              tokensEarned: 0,
              name,
              percents: 0,
            }),
            champion => ({ ...champion, name, percents: championPercents(champion) }),
          ),
        ),
    ),
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
    enrichedSummoner: { questPercents, totalChampionsCount, totalMasteryLevel, masteriesCount },
    enrichedMasteries: enrichedMasteries_,
  }
}

// Mastery 4: 50%
// Mastery 6 tokens: 7% each
// Mastery 7 tokens: 10% each
// Fragments (not based on user's favorites): 3% each
const championPercents = (c: ChampionMasteryView): number => {
  if (c.championLevel === 7) return 100

  // 6-0: 67%, 6-1: 77%, 6-2: 87%, 6-3: 97%
  if (c.championLevel === 6) return 67 + c.tokensEarned * 10

  // 5-0: 50%, 5-1: 57%, 5-2: 64%
  if (c.championLevel === 5) return 50 + c.tokensEarned * 7

  return (c.championPoints / 21600) * 50
}
