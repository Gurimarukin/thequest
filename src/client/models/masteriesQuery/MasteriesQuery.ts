import { readonlySet } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { MyPartial } from '../../../shared/models/MyPartial'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
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
  position: ReadonlySet<ChampionPosition>
  search: Maybe<string>
}

const queryLevelDefault: ReadonlySet<ChampionLevelOrZero> = new Set(
  pipe(
    ChampionLevelOrZero.values,
    List.filter(l => l !== 7),
  ),
)
const queryLevelEq = readonlySet.getEq(ChampionLevelOrZero.Eq)

const queryLaneDefault: ReadonlySet<ChampionPosition> = new Set(ChampionPosition.values)
const queryLaneEq = readonlySet.getEq(ChampionPosition.Eq)

const fromPartial = (partial: PartialMasteriesQuery): MasteriesQuery => ({
  sort: partial.sort ?? MasteriesQuerySort.default,
  order: partial.order ?? MasteriesQueryOrder.default,
  view: partial.view ?? MasteriesQueryView.default,
  level: partial.level ?? queryLevelDefault,
  position: partial.position ?? queryLaneDefault,
  search: Maybe.fromNullable(partial.search),
})

const toPartial = (query: MasteriesQuery): PartialMasteriesQuery => {
  const res: MyPartial<PartialMasteriesQuery> = {
    sort: query.sort === MasteriesQuerySort.default ? undefined : query.sort,
    order: query.order === MasteriesQueryOrder.default ? undefined : query.order,
    view: query.view === MasteriesQueryView.default ? undefined : query.view,
    level: queryLevelEq.equals(query.level, queryLevelDefault) ? undefined : query.level,
    position: queryLaneEq.equals(query.position, queryLaneDefault) ? undefined : query.position,
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
  position: pipe(lens.id<MasteriesQuery>(), lens.prop('position')),
  search: pipe(lens.id<MasteriesQuery>(), lens.prop('search')),
}

const MasteriesQuery = { fromPartial, toPartial, Lens }

export { MasteriesQuery }
