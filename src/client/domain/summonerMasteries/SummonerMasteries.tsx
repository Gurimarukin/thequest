/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { monoid, number, task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import debounce from 'lodash.debounce'
import { optional } from 'monocle-ts'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Business } from '../../../shared/Business'
import { MsDuration } from '../../../shared/models/MsDuration'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../../shared/models/api/Platform'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import type { ChampionShard } from '../../../shared/models/api/summoner/ChampionShardsPayload'
import { ChampionShardsView } from '../../../shared/models/api/summoner/ChampionShardsView'
import type { Puuid } from '../../../shared/models/api/summoner/Puuid'
import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { RiotId } from '../../../shared/models/riot/RiotId'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { PartialDict } from '../../../shared/utils/fp'
import { Dict, Future, List, Maybe, NonEmptyArray, NotUsed } from '../../../shared/utils/fp'

import { apiUserSelfSummonerChampionsShardsCountPost } from '../../api'
import { AsyncRenderer } from '../../components/AsyncRenderer'
import type { SetChampionShards } from '../../components/ChampionMasterySquare'
import { Loading } from '../../components/Loading'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useToaster } from '../../contexts/ToasterContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { useOnSearchSummoner } from '../../hooks/useOnSearchSummoner'
import { usePrevious } from '../../hooks/usePrevious'
import { ChampionAramCategory } from '../../models/ChampionAramCategory'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { cx } from '../../utils/cx'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import type { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { Masteries } from './Masteries'
import type { EnrichedSummonerView } from './Summoner'
import { Summoner } from './Summoner'
import { useChallenges } from './useChallenges'
import { useSummonerMasteries } from './useSummonerMasteries'

const { cleanChampionName } = StringUtils

const shardsDebounceWait = MsDuration.second(1)

// if we should mutate data before API response
type OptimisticMutation = {
  optimisticMutation: boolean
}

type Props = {
  platform: Platform
  riotId: RiotId
}

export const SummonerMasteries: React.FC<Props> = ({ platform, riotId }) => {
  const { t } = useTranslation()
  const { showToaster } = useToaster()
  const { maybeUser } = useUser()

  const { data, error, mutate } = useSummonerMasteries(platform, riotId)

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

  const [shardsIsLoading, setShardsIsLoading] = useState(false)
  const debouncedSetChampionsShardsBulk = useMemo(
    () =>
      debounce(
        (
          platform_: Platform,
          puuid: Puuid,
          updates: NonEmptyArray<ChampionShard>,
          optimisticMutation: boolean,
          oldData: SummonerMasteriesView,
          newData: SummonerMasteriesView,
        ): Promise<unknown> => {
          setShardsIsLoading(true)
          return pipe(
            apiUserSelfSummonerChampionsShardsCountPost(platform_, puuid, updates),
            Future.map(() => {
              if (!optimisticMutation) mutate(newData, { revalidate: false })
              showToaster('success', t.masteries.updateShardsSucces)
              return NotUsed
            }),
            Future.orElse(e => {
              if (optimisticMutation) mutate(oldData, { revalidate: false })
              console.error(e)
              showToaster('error', t.masteries.updateShardsError)
              return Future.notUsed
            }),
            task.chainFirstIOK(() => () => setShardsIsLoading(false)),
            futureRunUnsafe,
          )
        },
        MsDuration.unwrap(shardsDebounceWait),
      ),
    [mutate, showToaster, t],
  )

  const setChampionsShardsBulk = useCallback(
    (updates: NonEmptyArray<ChampionShard>, { optimisticMutation }: OptimisticMutation): void => {
      if (data === undefined || Maybe.isNone(data.championShards)) return

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
                }),
              ),
            ),
          ),
        ),
      )(data)

      if (optimisticMutation) mutate(newData, { revalidate: false })

      debouncedSetChampionsShardsBulk(
        platform,
        data.summoner.puuid,
        updates,
        optimisticMutation,
        data,
        newData,
      )
    },
    [data, debouncedSetChampionsShardsBulk, mutate, platform],
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
            shardsIsLoading={shardsIsLoading}
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
  shardsIsLoading: boolean
  setChampionsShardsBulk: (
    updates: NonEmptyArray<ChampionShard>,
    { optimisticMutation }: OptimisticMutation,
  ) => void
}

const SummonerViewComponent: React.FC<SummonerViewProps> = ({
  platform,
  summoner,
  leagues,
  masteries,
  championShards,
  shardsIsLoading,
  setChampionsShardsBulk,
}) => {
  const { masteriesQuery } = useHistory()
  const { champions } = useStaticData()

  const challenges = useChallenges(platform, summoner.puuid)

  useOnSearchSummoner(
    useMemo(() => ({ platform, ...summoner }), [platform, summoner]),
    appRoutes.platformRiotId(platform, summoner.riotId, MasteriesQuery.toPartial(masteriesQuery)),
  )

  const { enrichedSummoner, enrichedMasteries } = useMemo(
    () => enrichAll(masteries.champions, championShards, masteriesQuery.search, champions),
    [championShards, champions, masteries.champions, masteriesQuery.search],
  )

  const [uiIsBlocked, setUiIsBlocked] = useState(true)

  useEffect(() => {
    setUiIsBlocked(false)
  }, [])

  const setChampionShards = useMemo(
    (): SetChampionShards => ({
      isLoading: shardsIsLoading,
      run: (championKey: ChampionKey) => (shardsCount: number) =>
        setChampionsShardsBulk([{ championId: championKey, shardsCount }], {
          optimisticMutation: true,
        }),
    }),
    [setChampionsShardsBulk, shardsIsLoading],
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
    </>
  )
}

type EnrichedAll = {
  enrichedSummoner: Omit<EnrichedSummonerView, keyof SummonerView>
  enrichedMasteries: List<EnrichedChampionMastery>
}

type PartialMasteriesGrouped = PartialDict<`${number}`, NonEmptyArray<EnrichedChampionMastery>>

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
            tokensEarned: 0,
            markRequiredForNextLevel: 0,
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

  const totalMasteryPoints = pipe(
    enrichedMasteries_,
    List.map(c => c.championPoints),
    monoid.concatAll(number.MonoidSum),
  )

  const grouped: PartialMasteriesGrouped = pipe(
    enrichedMasteries_,
    NonEmptyArray.fromReadonlyArray,
    Maybe.map(
      List.groupBy(c => pipe(ChampionLevel.fromNumber(c.championLevel), ChampionLevel.stringify)),
    ),
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
      totalMasteryPoints,
      otpIndex: Business.otpRatio(enrichedMasteries_, totalMasteryPoints),
      masteriesCount: pipe(
        ChampionLevel.values,
        List.reduce(Dict.empty<`${number}`, number>(), (acc, championLevel) => {
          const lvl = ChampionLevel.stringify(championLevel)
          const value: number = grouped[lvl]?.length ?? 0

          return { ...acc, [lvl]: value }
        }),
      ),
    },
    enrichedMasteries: enrichedMasteries_,
  }
}
