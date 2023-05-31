import { number, ord, predicate, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, identity, pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'

import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionCategory } from '../../models/ChampionCategory'
import type { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'

type CategoryOrHidden = ChampionCategory | 'hidden'

type FilteredAndSortedMasteries = {
  filteredAndSortedMasteries: List<EnrichedChampionMastery>
  championsCount: number
  searchCount: number
  maybeMaxPoints: Maybe<number>
  hideInsteadOfGlow: boolean
  isHidden: (champion: EnrichedChampionMastery) => boolean
}

export const getFilteredAndSortedMasteries = (
  masteries: List<EnrichedChampionMastery>,
  query: MasteriesQuery,
): FilteredAndSortedMasteries => {
  const hideInsteadOfGlow =
    Maybe.isSome(query.search) && (query.view === 'histogram' || query.view === 'aram')

  const isHidden = getIsHidden({ hideInsteadOfGlow })

  const filterPredicate = pipe(
    levelFilterPredicate(query.level),
    predicate.and(positionFilterPredicate(query.position)),
  )

  const ords = getSortBy(query.sort, query.order)

  const filteredAndSortedMasteries_ = pipe(
    masteries,
    List.map(
      (m): EnrichedChampionMastery =>
        pipe(m, filterPredicate(m) ? identity : EnrichedChampionMastery.Lens.isHidden.set(true)),
    ),
    query.view === 'aram' ? sortAram(isHidden, ords) : List.sortBy(ords),
  )

  return {
    filteredAndSortedMasteries: filteredAndSortedMasteries_,
    championsCount: pipe(
      filteredAndSortedMasteries_,
      List.filter(c => !c.isHidden),
      List.size,
    ),
    searchCount: pipe(
      filteredAndSortedMasteries_,
      List.filter(c => c.glow),
      List.size,
    ),
    maybeMaxPoints: pipe(
      filteredAndSortedMasteries_,
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

const sortAram =
  (isHidden: (c: EnrichedChampionMastery) => boolean, ords: List<Ord<EnrichedChampionMastery>>) =>
  (as: List<EnrichedChampionMastery>): List<EnrichedChampionMastery> => {
    const grouped = pipe(
      as,
      List.groupBy((c): CategoryOrHidden => (isHidden(c) ? 'hidden' : c.category)),
    )
    return pipe(
      ChampionCategory.values,
      List.reduce(List.empty<EnrichedChampionMastery>(), (acc, category) =>
        pipe(acc, List.concat(pipe(grouped[category] ?? [], List.sortBy(ords)))),
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
    readonlySet.elem(ChampionLevelOrZero.Eq)(c.championLevel, levels)

const positionFilterPredicate =
  (positions: ReadonlySet<ChampionPosition>) =>
  (c: EnrichedChampionMastery): boolean =>
    pipe(
      c.positions,
      List.some(position => readonlySet.elem(ChampionPosition.Eq)(position, positions)),
    )

// At level 7, shards doesn't matter
// At level 6, more than 1 shard doesn't matter
// At level 5 and less, more than 2 shards doesn't matter
const ordByShardsWithLevel: Ord<EnrichedChampionMastery> = pipe(
  EnrichedChampionMastery.Ord.byShards,
  ord.contramap(c =>
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
