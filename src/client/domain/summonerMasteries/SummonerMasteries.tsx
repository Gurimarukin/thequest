/* eslint-disable functional/no-expression-statements */
import { monoid, number } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { HttpMethod } from 'ky/distribution/types/options'
import { optional } from 'monocle-ts'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { apiRoutes } from '../../../shared/ApiRouter'
import { Business } from '../../../shared/Business'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../../shared/models/api/Platform'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import type { ChampionShardsPayload } from '../../../shared/models/api/summoner/ChampionShardsPayload'
import { ChampionShardsView } from '../../../shared/models/api/summoner/ChampionShardsView'
import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { PartialDict, Tuple } from '../../../shared/utils/fp'
import { Dict, Future, List, Maybe, NonEmptyArray, NotUsed } from '../../../shared/utils/fp'

import { apiUserSelfSummonerChampionsShardsCountPost } from '../../api'
import { AsyncRenderer } from '../../compo../../components/AsyncRenderer'
import { Loading } from '../../components/Loading'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { config } from '../../config/unsafe'
import { HistoryState, useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { usePlatformSummonerNameFromLocation } from '../../hooks/usePlatformSummonerNameFromLocation'
import { usePrevious } from '../../hooks/usePrevious'
import { ChampionAramCategory } from '../../models/ChampionAramCategory'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { cx } from '../../utils/cx'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { http } from '../../utils/http'
import type { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { Masteries } from './Masteries'
import type { ShardsToRemoveNotification } from './ShardsToRemoveModal'
import { ShardsToRemoveModal } from './ShardsToRemoveModal'
import type { EnrichedSummonerView } from './Summoner'
import { Summoner } from './Summoner'
import { useChallenges } from './useChallenges'

const { cleanChampionName } = StringUtils

// should mutate data before API response
type OptimisticMutation = {
  optimisticMutation: boolean
}

type Props = {
  platform: Platform
  summonerName: string
}

export const SummonerMasteries: React.FC<Props> = ({ platform, summonerName }) => {
  const { historyStateRef, modifyHistoryStateRef } = useHistory()
  const { maybeUser } = useUser()
  const { t } = useTranslation()

  const { data, error, mutate } = useSWR<SummonerMasteriesView, unknown, Tuple<string, HttpMethod>>(
    apiRoutes.summoner.byName(platform, summonerName).masteries.get,
    urlWithMethod =>
      pipe(
        historyStateRef.current.summonerMasteries,
        Maybe.fold(
          () => http(urlWithMethod, {}, [SummonerMasteriesView.codec, 'SummonerMasteriesView']),
          flow(
            Future.successful,
            Future.chainFirstIOK(
              () => () =>
                modifyHistoryStateRef(HistoryState.Lens.summonerMasteries.set(Maybe.none)),
            ),
          ),
        ),
        futureRunUnsafe,
      ),
    {
      revalidateIfStale: !config.isDev,
      revalidateOnFocus: !config.isDev,
      revalidateOnReconnect: !config.isDev,
    },
  )

  // Remove shards on user disconnect
  const previousUser = usePrevious(maybeUser)
  useEffect(() => {
    if (
      data !== undefined &&
      Maybe.isNone(maybeUser) &&
      Maybe.isSome(Maybe.flatten(previousUser))
    ) {
      mutate({ ...data, championShards: Maybe.none }, { revalidate: false })
    }
  }, [data, maybeUser, mutate, previousUser])

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
        Future.orElse(e => {
          if (optimisticMutation) mutate(data, { revalidate: false })
          console.error(e)
          // TODO: error toaster
          alert(t.masteries.updateShardsError)
          return Future.notUsed
        }),
      )
    },
    [data, mutate, platform, t.masteries.updateShardsError],
  )

  return (
    <MainLayout>
      <AsyncRenderer data={data} error={error}>
        {({ summoner, leagues, masteries, championShards }) => (
          <SummonerViewComponent
            platform={platform}
            summoner={summoner}
            leagues={leagues}
            masteries={masteries}
            championShards={championShards}
            setChampionsShardsBulk={setChampionsShardsBulk}
          />
        )}
      </AsyncRenderer>
    </MainLayout>
  )
}

type SummonerViewProps = {
  platform: Platform
  summoner: SummonerView
  leagues: SummonerLeaguesView
  masteries: SummonerMasteriesView['masteries']
  championShards: Maybe<List<ChampionShardsView>>
  setChampionsShardsBulk: (
    updates: NonEmptyArray<ChampionShardsPayload>,
    { optimisticMutation }: OptimisticMutation,
  ) => Future<NotUsed>
}

const SummonerViewComponent: React.FC<SummonerViewProps> = ({
  platform,
  summoner,
  leagues,
  masteries,
  championShards,
  setChampionsShardsBulk,
}) => {
  const { navigate, masteriesQuery } = useHistory()
  const { addRecentSearch } = useUser()
  const { champions } = useStaticData()

  const challenges = useChallenges(platform, summoner.name)

  useEffect(
    () =>
      addRecentSearch({
        platform,
        puuid: summoner.puuid,
        name: summoner.name,
        profileIconId: summoner.profileIconId,
      }),
    [addRecentSearch, platform, summoner.name, summoner.profileIconId, summoner.puuid],
  )

  const summonerNameFromLocation = usePlatformSummonerNameFromLocation()?.summonerName

  // Correct case of summoner's name in url
  useEffect(() => {
    if (summonerNameFromLocation !== summoner.name) {
      navigate(
        appRoutes.platformSummonerName(
          platform,
          summoner.name,
          MasteriesQuery.toPartial(masteriesQuery),
        ),
        { replace: true },
      )
    }
  }, [summonerNameFromLocation, masteriesQuery, navigate, platform, summoner.name])

  const { enrichedSummoner, enrichedMasteries } = useMemo(
    () => enrichAll(masteries.champions, championShards, masteriesQuery.search, champions),
    [championShards, masteries, masteriesQuery.search, champions],
  )

  const [uiIsBlocked, setUiIsBlocked] = useState(true)

  useEffect(() => {
    setUiIsBlocked(false)
  }, [])

  const [isNotificationsHidden, setIsNotificationsHidden] = useState(false)

  const hideNotifications = useCallback(() => setIsNotificationsHidden(true), [])

  const notifications = useMemo(
    () => getNotifications(championShards, enrichedMasteries),
    [championShards, enrichedMasteries],
  )

  useEffect(() => {
    setIsNotificationsHidden(false)
  }, [])

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
      {uiIsBlocked ? (
        <div className="flex justify-center">
          <Loading className="mt-4 h-6 self-center" />
        </div>
      ) : null}
      <div
        className={cx(
          'flex h-full flex-col items-center gap-6 overflow-y-auto overflow-x-hidden px-2 pb-24 pt-3',
          ['hidden', uiIsBlocked],
        )}
      >
        <Summoner
          summoner={{ ...summoner, ...enrichedSummoner }}
          leagues={leagues}
          masteries={masteries}
        />
        <Masteries
          challenges={challenges}
          masteries={enrichedMasteries}
          setChampionShards={setChampionShards}
        />
      </div>
      {pipe(
        notifications,
        Maybe.filter(() => !uiIsBlocked && !isNotificationsHidden),
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
    List.map(({ key, name, positions, factions, aram }): EnrichedChampionMastery => {
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
        Maybe.exists(search => cleanChampionName(name).includes(cleanChampionName(search))),
      )
      const category = ChampionAramCategory.fromAramData(aram)
      const faction = StaticDataChampion.getFaction(factions)
      const isHidden = false

      return pipe(
        pipe(
          masteries,
          ListUtils.findFirstBy(ChampionKey.Eq)(c => c.championId),
        )(key),
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
            factions,
            aram,
            category,
            faction,
            isHidden,
          }),
          champion => ({
            ...champion,
            name,
            percents: Business.championPercents(champion),
            shardsCount,
            glow,
            positions,
            factions,
            aram,
            category,
            faction,
            isHidden,
          }),
        ),
      )
    }),
  )

  const grouped: PartialMasteriesGrouped = pipe(
    enrichedMasteries_,
    NonEmptyArray.fromReadonlyArray,
    Maybe.map(List.groupBy(c => ChampionLevelOrZero.stringify(c.championLevel))),
    Maybe.getOrElse(() => ({})),
  )
  return {
    enrichedSummoner: {
      questPercents: pipe(
        enrichedMasteries_,
        List.map(c => c.percents),
        NumberUtils.average,
      ),
      totalMasteryLevel: pipe(
        enrichedMasteries_,
        List.map(c => c.championLevel),
        monoid.concatAll(number.MonoidSum),
      ),
      totalMasteryPoints: pipe(
        enrichedMasteries_,
        List.map(c => c.championPoints),
        monoid.concatAll(number.MonoidSum),
      ),
      masteriesCount: pipe(
        ChampionLevelOrZero.values,
        List.reduce(Dict.empty<`${ChampionLevelOrZero}`, number>(), (acc, key) => {
          const value: number = grouped[key]?.length ?? 0
          return { ...acc, [key]: value }
        }),
      ),
    },
    enrichedMasteries: enrichedMasteries_,
  }
}

const getNotifications = (
  championShards: Maybe<List<ChampionShardsView>>,
  enrichedMasteries: EnrichedAll['enrichedMasteries'],
): Maybe<NonEmptyArray<ShardsToRemoveNotification>> =>
  pipe(
    championShards,
    Maybe.map(
      List.filterMap(({ champion, count, shardsToRemoveFromNotification }) =>
        pipe(
          shardsToRemoveFromNotification,
          Maybe.chain(n =>
            pipe(
              pipe(
                enrichedMasteries,
                ListUtils.findFirstBy(ChampionKey.Eq)(c => c.championId),
              )(champion),
              Maybe.map(
                (c): ShardsToRemoveNotification => ({
                  championId: champion,
                  name: c.name,
                  championLevel: c.championLevel,
                  championPoints: c.championPoints,
                  championPointsSinceLastLevel: c.championPointsSinceLastLevel,
                  championPointsUntilNextLevel: c.championPointsUntilNextLevel,
                  percents: c.percents,
                  chestGranted: c.chestGranted,
                  tokensEarned: c.tokensEarned,
                  shardsCount: count,
                  positions: c.positions,
                  factions: c.factions,
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
  )
