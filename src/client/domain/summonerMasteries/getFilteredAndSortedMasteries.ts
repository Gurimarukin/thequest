import { number, ord, predicate, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, identity, pipe } from 'fp-ts/function'
import type { SWRResponse } from 'swr'

import type { ChallengesView } from '../../../shared/models/api/challenges/ChallengesView'
import type { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import { ChampionFactionOrNone } from '../../../shared/models/api/champion/ChampionFaction'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { List, Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import type { CountWithTotal } from '../../models/CountWithTotal'
import { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import type { Translation } from '../../models/Translation'
import type { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { ChampionFactionUtils } from '../../utils/ChampionFactionUtils'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'

type CategoryOrHidden = MapChangesChampionCategory | 'hidden'
type FactionOrNoneOrHidden = ChampionFactionOrNone | 'hidden'

export type FilteredAndSortedMasteries = {
  filteredAndSortedMasteries: List<EnrichedChampionMastery>
  championsCount: number
  factionsCount: FactionsCount
  searchCount: number
  maybeMaxPoints: Maybe<number>
  hideInsteadOfGlow: boolean
  isHidden: (champion: EnrichedChampionMastery) => boolean
}

export type FactionsCount = PartialDict<ChampionFactionOrNone, CountWithTotal>

const hideInsteadOfGlowViews: ReadonlySet<MasteriesQueryView> = new Set<MasteriesQueryView>([
  'histogram',
  'aram',
  'urf',
  'factions',
])

export const getFilteredAndSortedMasteries = (
  t: Translation['common'],
  challenges: SWRResponse<ChallengesView, unknown>,
  masteries: List<EnrichedChampionMastery>,
  query: MasteriesQuery,
): FilteredAndSortedMasteries => {
  const hideInsteadOfGlow =
    Maybe.isSome(query.search) &&
    readonlySet.elem(MasteriesQueryView.Eq)(query.view, hideInsteadOfGlowViews)

  const isHidden = getIsHidden({ hideInsteadOfGlow })

  const filterPredicate = pipe(
    levelFilterPredicate(query.level),
    predicate.and(factionFilterPredicate(query.faction)),
    predicate.and(positionFilterPredicate(query.position)),
  )

  const ords = getSortBy(query.sort, query.order)

  const filteredMasteries = pipe(
    masteries,
    List.map(
      (m): EnrichedChampionMastery =>
        pipe(m, filterPredicate(m) ? identity : EnrichedChampionMastery.Lens.isHidden.set(true)),
    ),
  )

  return {
    filteredAndSortedMasteries: pipe(
      filteredMasteries,
      getSort(t, challenges, isHidden, query.view)(ords),
    ),
    championsCount: pipe(
      filteredMasteries,
      List.filter(c => !c.isHidden),
      List.size,
    ),
    factionsCount: pipe(
      filteredMasteries,
      ListUtils.multipleGroupBy(
        (c): NonEmptyArray<ChampionFactionOrNone> =>
          List.isNonEmpty(c.factions) ? c.factions : ['none'],
      ),
      PartialDict.map(
        (nea): CountWithTotal => ({
          count: nea.filter(c => !c.isHidden).length,
          total: nea.length,
        }),
      ),
    ),
    searchCount: pipe(
      filteredMasteries,
      List.filter(c => c.glow),
      List.size,
    ),
    maybeMaxPoints: pipe(
      filteredMasteries,
      NonEmptyArray.fromReadonlyArray,
      Maybe.map(
        flow(
          NonEmptyArray.map(c =>
            // `championPointsUntilNextLevel` can be negative
            Math.max(c.championPoints + c.championPointsUntilNextLevel, c.championPoints),
          ),
          NonEmptyArray.max(number.Ord),
        ),
      ),
    ),
    hideInsteadOfGlow,
    isHidden,
  }
}

const getSort = (
  t: Translation['common'],
  challenges: SWRResponse<ChallengesView, unknown>,
  isHidden: (c: EnrichedChampionMastery) => boolean,
  view: MasteriesQueryView,
): ((
  ords: List<Ord<EnrichedChampionMastery>>,
) => (as: List<EnrichedChampionMastery>) => List<EnrichedChampionMastery>) => {
  switch (view) {
    case 'compact':
    case 'histogram':
      return List.sortBy

    case 'aram':
      return sortMapChanges(isHidden, c => c.aram.category)

    case 'urf':
      return sortMapChanges(isHidden, c => c.urf.category)

    case 'factions':
      return sortFactions(t, challenges, isHidden)
  }
}

const sortMapChanges =
  (
    isHidden: (c: EnrichedChampionMastery) => boolean,
    getCategory: (c: EnrichedChampionMastery) => MapChangesChampionCategory,
  ) =>
  (ords: List<Ord<EnrichedChampionMastery>>) =>
  (as: List<EnrichedChampionMastery>): List<EnrichedChampionMastery> => {
    const grouped = pipe(
      as,
      List.groupBy((c): CategoryOrHidden => (isHidden(c) ? 'hidden' : getCategory(c))),
    )

    return pipe(
      MapChangesChampionCategory.values,
      List.reduce(List.empty<EnrichedChampionMastery>(), (acc, category) =>
        pipe(acc, List.concat(pipe(grouped[category] ?? [], List.sortBy(ords)))),
      ),
      List.concat(grouped.hidden ?? []),
    )
  }

const sortFactions =
  (
    t: Translation['common'],
    challenges: SWRResponse<ChallengesView, unknown>,
    isHidden: (c: EnrichedChampionMastery) => boolean,
  ) =>
  (ords: List<Ord<EnrichedChampionMastery>>) =>
  (as: List<EnrichedChampionMastery>): List<EnrichedChampionMastery> => {
    const grouped = pipe(
      as,
      ListUtils.multipleGroupBy((c): NonEmptyArray<FactionOrNoneOrHidden> => {
        if (isHidden(c)) return ['hidden']
        if (List.isNonEmpty(c.factions)) return c.factions
        return ['none']
      }),
      PartialDict.mapWithIndex((faction, champions) =>
        pipe(
          champions,
          NonEmptyArray.map(c =>
            pipe(
              c,
              EnrichedChampionMastery.Lens.faction.set(
                faction === 'hidden' ? StaticDataChampion.getFaction(c.factions) : faction,
              ),
            ),
          ),
        ),
      ),
    )
    return pipe(
      ChampionFactionOrNone.valuesSortBy(factionSortBy(t, challenges)),
      List.reduce(List.empty<EnrichedChampionMastery>(), (acc, faction) =>
        pipe(acc, List.concat(pipe(grouped[faction] ?? [], List.sortBy(ords)))),
      ),
      List.concat(grouped.hidden ?? []),
    )
  }

const factionSortBy = (
  t: Translation['common'],
  { data: challenges }: SWRResponse<ChallengesView, unknown>,
): List<Ord<ChampionFaction>> => {
  const byLabel = ChampionFactionUtils.Ord.byLabel(t)

  if (challenges === undefined) return [byLabel]

  const byChallengeValue = pipe(
    number.Ord,
    ord.contramap((f: ChampionFaction) =>
      pipe(
        challenges[f],
        Maybe.fold(
          () => 0,
          c => c.value,
        ),
      ),
    ),
    ord.reverse,
  )
  return [byChallengeValue, byLabel]
}

type HideInsteadOfGlow = {
  hideInsteadOfGlow: boolean
}

const getIsHidden =
  ({ hideInsteadOfGlow }: HideInsteadOfGlow) =>
  (c: EnrichedChampionMastery) =>
    c.isHidden || (hideInsteadOfGlow && !c.glow)

const getSortBy = (
  sort: MasteriesQuerySort,
  order: MasteriesQueryOrder,
): NonEmptyArray<Ord<EnrichedChampionMastery>> => {
  switch (sort) {
    case 'level':
      return [
        reverseIfDesc(EnrichedChampionMastery.Ord.byLevel),
        reverseIfDesc(EnrichedChampionMastery.Ord.byTokens),
        reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
        EnrichedChampionMastery.Ord.byName,
      ]

    case 'percents':
      return [
        reverseIfDesc(EnrichedChampionMastery.Ord.byPercents),
        reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
        EnrichedChampionMastery.Ord.byName,
      ]

    case 'points':
      return [
        reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
        EnrichedChampionMastery.Ord.byName,
      ]

    case 'name':
      return [reverseIfDesc(EnrichedChampionMastery.Ord.byName)]
  }

  function reverseIfDesc<A>(o: Ord<A>): Ord<A> {
    switch (order) {
      case 'asc':
        return o
      case 'desc':
        return ord.reverse(o)
    }
  }
}

const levelFilterPredicate =
  (levels: ReadonlySet<ChampionLevel>): Predicate<EnrichedChampionMastery> =>
  c =>
    // always keep if all levels are selected
    readonlySet.size(levels) === ChampionLevel.values.length ||
    // convert to 10 if 10+
    readonlySet.elem(ChampionLevel.Eq)(ChampionLevel.fromNumber(c.championLevel), levels)

const factionFilterPredicate =
  (factions: ReadonlySet<ChampionFactionOrNone>): Predicate<EnrichedChampionMastery> =>
  c =>
    readonlySet.size(factions) === ChampionFactionOrNone.values.length ||
    (List.isNonEmpty(c.factions)
      ? pipe(
          c.factions,
          List.some(faction => readonlySet.elem(ChampionFactionOrNone.Eq)(faction, factions)),
        )
      : readonlySet.elem(ChampionFactionOrNone.Eq)('none', factions))

const positionFilterPredicate =
  (positions: ReadonlySet<ChampionPosition>): Predicate<EnrichedChampionMastery> =>
  c =>
    readonlySet.size(positions) === ChampionPosition.values.length ||
    pipe(
      c.positions,
      List.some(position => readonlySet.elem(ChampionPosition.Eq)(position, positions)),
    )
