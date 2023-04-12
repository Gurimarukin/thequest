import { readonlySet } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { Dict, List, Maybe } from '../../../shared/utils/fp'

import { MasteriesQueryOrder } from './MasteriesQueryOrder'
import { MasteriesQuerySort } from './MasteriesQuerySort'
import { MasteriesQueryView } from './MasteriesQueryView'
import type { PartialMasteriesQuery } from './PartialMasteriesQuery'

type MasteriesQuery = {
  sort: MasteriesQuerySort
  order: MasteriesQueryOrder
  view: MasteriesQueryView
  level: ReadonlySet<ChampionLevelOrZero>
  search: Maybe<string>
}

const queryLevelDefault: ReadonlySet<ChampionLevelOrZero> = new Set(
  pipe(
    ChampionLevelOrZero.values,
    List.filter(l => l !== 7),
  ),
)
const queryLevelEq = readonlySet.getEq(ChampionLevelOrZero.Eq)

const fromPartial = (partial: PartialMasteriesQuery): MasteriesQuery => ({
  sort: partial.sort ?? MasteriesQuerySort.default,
  order: partial.order ?? MasteriesQueryOrder.default,
  view: partial.view ?? MasteriesQueryView.default,
  level: partial.level ?? queryLevelDefault,
  search: Maybe.fromNullable(partial.search),
})

const toPartial = (query: MasteriesQuery): PartialMasteriesQuery => {
  type MyPartial = {
    [K in keyof Required<PartialMasteriesQuery>]: PartialMasteriesQuery[K] | undefined
  }

  const res: MyPartial = {
    sort: query.sort === MasteriesQuerySort.default ? undefined : query.sort,
    order: query.order === MasteriesQueryOrder.default ? undefined : query.order,
    view: query.view === MasteriesQueryView.default ? undefined : query.view,
    level: queryLevelEq.equals(query.level, queryLevelDefault) ? undefined : query.level,
    search: Maybe.toUndefined(query.search),
  }
  return pipe(
    res,
    Dict.filter(val => val !== undefined),
  )
}

const Lens = {
  sort: pipe(lens.id<MasteriesQuery>(), lens.prop('sort')),
  order: pipe(lens.id<MasteriesQuery>(), lens.prop('order')),
  view: pipe(lens.id<MasteriesQuery>(), lens.prop('view')),
  level: pipe(lens.id<MasteriesQuery>(), lens.prop('level')),
  search: pipe(lens.id<MasteriesQuery>(), lens.prop('search')),
}

const MasteriesQuery = { fromPartial, toPartial, Lens }

export { MasteriesQuery }
