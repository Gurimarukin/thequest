/* eslint-disable functional/no-expression-statements */
import { monoid, number, random } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { Business } from '../../../shared/Business'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../../shared/models/api/Platform'
import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import type { ChampionShardsPayload } from '../../../shared/models/api/summoner/ChampionShardsPayload'
import { ChampionShardsView } from '../../../shared/models/api/summoner/ChampionShardsView'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { PartialDict } from '../../../shared/utils/fp'
import { Dict, Future, List, Maybe, NonEmptyArray, NotUsed } from '../../../shared/utils/fp'

import { apiUserSelfSummonerChampionsShardsCountPost } from '../../api'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useUser } from '../../contexts/UserContext'
import { usePrevious } from '../../hooks/usePrevious'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { useSummonerNameFromLocation } from '../../hooks/useSummonerNameFromLocation'
import { ChampionCategory } from '../../models/ChampionCategory'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import type { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { Masteries } from './Masteries'
import type { ShardsToRemoveNotification } from './ShardsToRemoveModal'
import { ShardsToRemoveModal } from './ShardsToRemoveModal'
import type { EnrichedSummonerView } from './Summoner'
import { Summoner } from './Summoner'

// should mutate data before API response
type OptimisticMutation = {
  optimisticMutation: boolean
}

type Props = {
  platform: Platform
  summonerName: string
}

export const SummonerMasteries = ({ platform, summonerName }: Props): JSX.Element => {
  const { user } = useUser()

  const { data, error, mutate } = useSWRHttp(
    apiRoutes.summoner.get(platform, clearSummonerName(summonerName)),
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

  const setChampionsShardsBulk = useCallback(
    (
      updates: NonEmptyArray<ChampionShardsPayload>,
      { optimisticMutation }: OptimisticMutation,
    ): Future<NotUsed> => {
      if (data === undefined || Maybe.isNone(data.championShards)) return Future.notUsed

      const newData: SummonerMasteriesView = pipe(
        SummonerMasteriesView.Lens.championShards,
        optional.modify(championsShards =>
          pipe(
            updates,
            NonEmptyArray.reduce(championsShards, (acc, { championId, shardsCount }) =>
              pipe(
                acc,
                ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)({
                  champion: championId,
                  count: shardsCount,
                  shardsToRemoveFromNotification: Maybe.none,
                }),
              ),
            ),
          ),
        ),
      )(data)

      if (optimisticMutation) mutate(newData, { revalidate: false })

      return pipe(
        apiUserSelfSummonerChampionsShardsCountPost(platform, data.summoner.name, updates),
        Future.map(() => {
          if (!optimisticMutation) mutate(newData, { revalidate: false })
          return NotUsed
        }),
        // TODO: sucess toaster
        // Future.map(() => {}),
        Future.orElse(() => {
          if (optimisticMutation) mutate(data, { revalidate: false })
          // TODO: error toaster
          alert('Erreur lors de la modification des fragments')
          return Future.notUsed
        }),
      )
    },
    [data, mutate, platform],
  )

  return (
    <MainLayout>
      {basicAsyncRenderer({ data, error })(({ summoner, masteries, championShards }) => (
        <SummonerViewComponent
          platform={platform}
          summoner={summoner}
          masteries={masteries}
          championShards={championShards}
          setChampionsShardsBulk={setChampionsShardsBulk}
        />
      ))}
    </MainLayout>
  )
}

const whiteSpaces = /\s+/g
const clearSummonerName = (name: string): string => name.toLowerCase().replaceAll(whiteSpaces, '')

const nonAZ = /[^a-z]/g
const clearChampionName = (name: string): string =>
  StringUtils.cleanUTF8ToASCII(name).toLowerCase().replaceAll(nonAZ, '')

type SummonerViewProps = {
  platform: Platform
  summoner: SummonerView
  masteries: List<ChampionMasteryView>
  championShards: Maybe<List<ChampionShardsView>>
  setChampionsShardsBulk: (
    updates: NonEmptyArray<ChampionShardsPayload>,
    { optimisticMutation }: OptimisticMutation,
  ) => Future<NotUsed>
}

const SummonerViewComponent = ({
  platform,
  summoner,
  masteries,
  championShards,
  setChampionsShardsBulk,
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
    () => enrichAll(masteries, championShards, masteriesQuery.search, staticData.champions),
    [championShards, masteries, masteriesQuery.search, staticData.champions],
  )

  const [isNotificationsHidden, setIsNotificationsHidden] = useState(false)

  const hideNotifications = useCallback(() => setIsNotificationsHidden(true), [])

  const notifications = useMemo(
    (): Maybe<NonEmptyArray<ShardsToRemoveNotification>> =>
      pipe(
        championShards,
        Maybe.map(
          List.filterMap(({ champion, count, shardsToRemoveFromNotification }) =>
            pipe(
              shardsToRemoveFromNotification,
              Maybe.chain(n =>
                pipe(
                  enrichedMasteries,
                  List.findFirst(c => ChampionKey.Eq.equals(c.championId, champion)),
                  Maybe.map(
                    (c): ShardsToRemoveNotification => ({
                      championId: champion,
                      name: c.name,
                      championLevel: c.championLevel,
                      championPoints: c.championPoints,
                      championPointsUntilNextLevel: c.championPointsUntilNextLevel,
                      percents: c.percents,
                      chestGranted: c.chestGranted,
                      tokensEarned: c.tokensEarned,
                      shardsCount: count,
                      positions: c.positions,
                      aram: c.aram,
                      leveledUpFrom: n.leveledUpFrom,
                      shardsToRemove: n.shardsToRemove,
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
        Maybe.chain(NonEmptyArray.fromReadonlyArray),
      ),
    [championShards, enrichedMasteries],
  )

  useEffect(() => {
    setIsNotificationsHidden(false)
  }, [notifications])

  const setChampionShards = useCallback(
    (championKey: ChampionKey) => (shardsCount: number) =>
      pipe(
        setChampionsShardsBulk([{ championId: championKey, shardsCount }], {
          optimisticMutation: true,
        }),
        futureRunUnsafe,
      ),
    [setChampionsShardsBulk],
  )

  const nonOptimisticSetChampionsShardsBulk = useCallback(
    (updates: NonEmptyArray<ChampionShardsPayload>): Future<NotUsed> =>
      setChampionsShardsBulk(updates, { optimisticMutation: false }),
    [setChampionsShardsBulk],
  )

  return (
    <>
      <div className="flex h-full flex-col gap-6 overflow-y-auto overflow-x-hidden px-2 pb-24 pt-3">
        <Summoner summoner={{ ...summoner, ...enrichedSummoner }} />
        <Masteries masteries={enrichedMasteries} setChampionShards={setChampionShards} />
      </div>
      {pipe(
        notifications,
        Maybe.filter(() => !isNotificationsHidden),
        Maybe.fold(
          () => null,
          n => (
            <ShardsToRemoveModal
              notifications={n}
              setChampionsShardsBulk={nonOptimisticSetChampionsShardsBulk}
              hide={hideNotifications}
            />
          ),
        ),
      )}
    </>
  )
}

type EnrichedAll = {
  enrichedSummoner: Omit<EnrichedSummonerView, keyof SummonerView>
  enrichedMasteries: List<EnrichedChampionMastery>
}

type PartialMasteriesGrouped = PartialDict<
  `${ChampionLevelOrZero}`,
  NonEmptyArray<EnrichedChampionMastery>
>

const enrichAll = (
  masteries: List<ChampionMasteryView>,
  championShards: Maybe<List<ChampionShardsView>>,
  maybeSearch: Maybe<string>,
  staticDataChampions: List<StaticDataChampion>,
): EnrichedAll => {
  const enrichedMasteries_ = pipe(
    staticDataChampions,
    List.map(({ key, name, positions, aram }): EnrichedChampionMastery => {
      const shardsCount = pipe(
        championShards,
        Maybe.map(
          flow(
            List.findFirst(s => ChampionKey.Eq.equals(s.champion, key)),
            Maybe.fold(
              () => 0,
              s => s.count,
            ),
          ),
        ),
      )

      const glow = pipe(
        maybeSearch,
        Maybe.filter(search => clearChampionName(name).includes(clearChampionName(search))),
        Maybe.map(() => random.random()),
      )

      return pipe(
        masteries,
        List.findFirst(c => ChampionKey.Eq.equals(c.championId, key)),
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
            shardsCount,
            glow,
            positions,
            aram,
            category: ChampionCategory.fromAramData(aram),
            isHidden: false,
          }),
          champion => ({
            ...champion,
            name,
            percents: Business.championPercents(champion),
            shardsCount,
            glow,
            positions,
            aram,
            category: ChampionCategory.fromAramData(aram),
            isHidden: false,
          }),
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
    List.reduce(Dict.empty<`${ChampionLevelOrZero}`, number>(), (acc, key) => {
      const value: number = grouped[key]?.length ?? 0
      return { ...acc, [key]: value }
    }),
  )
  return {
    enrichedSummoner: {
      questPercents,
      totalMasteryLevel,
      masteriesCount,
    },
    enrichedMasteries: enrichedMasteries_,
  }
}
