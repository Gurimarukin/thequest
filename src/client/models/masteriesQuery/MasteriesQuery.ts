import { readonlySet } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { Dict, List } from '../../../shared/utils/fp'

import { MasteriesQueryOrder } from './MasteriesQueryOrder'
import { MasteriesQuerySort } from './MasteriesQuerySort'
import { MasteriesQueryView } from './MasteriesQueryView'
import type { PartialMasteriesQuery } from './PartialMasteriesQuery'

type MasteriesQuery = {
  readonly sort: MasteriesQuerySort
  readonly order: MasteriesQueryOrder
  readonly view: MasteriesQueryView
  readonly level: ReadonlySet<ChampionLevelOrZero>
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
})

const toPartial = (query: MasteriesQuery): PartialMasteriesQuery => {
  type MyPartial = {
    readonly [K in keyof Required<PartialMasteriesQuery>]: PartialMasteriesQuery[K] | undefined
  }

  const res: MyPartial = {
    sort: query.sort === MasteriesQuerySort.default ? undefined : query.sort,
    order: query.order === MasteriesQueryOrder.default ? undefined : query.order,
    view: query.view === MasteriesQueryView.default ? undefined : query.view,
    level: queryLevelEq.equals(query.level, queryLevelDefault) ? undefined : query.level,
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
}

const MasteriesQuery = { fromPartial, toPartial, Lens }

export { MasteriesQuery }
