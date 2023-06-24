import { number, ord, predicate, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, identity, pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'

import { ChampionFactionOrNone } from '../../../shared/models/api/champion/ChampionFaction'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { List, Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import { ChampionAramCategory } from '../../models/ChampionAramCategory'
import type { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'

type CategoryOrHidden = ChampionAramCategory | 'hidden'
type FactionOrNoneOrHidden = ChampionFactionOrNone | 'hidden'

type FilteredAndSortedMasteries = {
  filteredAndSortedMasteries: List<EnrichedChampionMastery>
  championsCount: number
  searchCount: number
  maybeMaxPoints: Maybe<number>
  hideInsteadOfGlow: boolean
  isHidden: (champion: EnrichedChampionMastery) => boolean
}

const hideInsteadOfGlowViews: ReadonlySet<MasteriesQueryView> = new Set<MasteriesQueryView>([
  'histogram',
  'aram',
  'factions',
])

export const getFilteredAndSortedMasteries = (
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
    filteredAndSortedMasteries: pipe(filteredMasteries, getSort(isHidden, query.view)(ords)),
    championsCount: pipe(
      filteredMasteries,
      List.filter(c => !c.isHidden),
      List.size,
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
          NonEmptyArray.map(c => c.championPoints + c.championPointsUntilNextLevel),
          NonEmptyArray.max(number.Ord),
        ),
      ),
    ),
    hideInsteadOfGlow,
    isHidden,
  }
}

const getSort = (
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
      return sortAram(isHidden)

    case 'factions':
      return sortFactions(isHidden)
  }
}

const sortAram =
  (isHidden: (c: EnrichedChampionMastery) => boolean) =>
  (ords: List<Ord<EnrichedChampionMastery>>) =>
  (as: List<EnrichedChampionMastery>): List<EnrichedChampionMastery> => {
    const grouped = pipe(
      as,
      List.groupBy((c): CategoryOrHidden => (isHidden(c) ? 'hidden' : c.category)),
    )
    return pipe(
      ChampionAramCategory.values,
      List.reduce(List.empty<EnrichedChampionMastery>(), (acc, category) =>
        pipe(acc, List.concat(pipe(grouped[category] ?? [], List.sortBy(ords)))),
      ),
      List.concat(grouped.hidden ?? []),
    )
  }

const sortFactions =
  (isHidden: (c: EnrichedChampionMastery) => boolean) =>
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
      ChampionFactionOrNone.values,
      List.reduce(List.empty<EnrichedChampionMastery>(), (acc, faction) =>
        pipe(acc, List.concat(pipe(grouped[faction] ?? [], List.sortBy(ords)))),
      ),
      List.concat(grouped.hidden ?? []),
    )
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
): List<Ord<EnrichedChampionMastery>> => {
  switch (sort) {
    case 'percents':
      return [
        reverseIfDesc(EnrichedChampionMastery.Ord.byPercents),
        reverseIfDesc(ordByShardsWithLevel),
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
  (levels: ReadonlySet<ChampionLevelOrZero>): Predicate<EnrichedChampionMastery> =>
  c =>
    readonlySet.size(levels) === ChampionLevelOrZero.values.length ||
    readonlySet.elem(ChampionLevelOrZero.Eq)(c.championLevel, levels)

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

// At level 7, shards doesn't matter
// At level 6, more than 1 shard doesn't matter
// At level 5 and less, more than 2 shards doesn't matter
const ordByShardsWithLevel: Ord<EnrichedChampionMastery> = pipe(
  EnrichedChampionMastery.Ord.byShards,
  ord.contramap((c: EnrichedChampionMastery) =>
    pipe(
      EnrichedChampionMastery.Lens.shardsCount,
      optional.modify(shardsCount => {
        if (c.championLevel === 7) return Math.min(shardsCount, 0)
        if (c.championLevel === 6) return Math.min(shardsCount, 1)
        return Math.min(shardsCount, 2)
      }),
    )(c),
  ),
)
