import { readonlySet } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { MyPartial } from '../../../shared/models/MyPartial'
import { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
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
  faction: ReadonlySet<ChampionFaction>
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

const queryPositionDefault: ReadonlySet<ChampionPosition> = new Set(ChampionPosition.values)
const queryPositionEq = readonlySet.getEq(ChampionPosition.Eq)

const queryFactionDefault: ReadonlySet<ChampionFaction> = new Set(ChampionFaction.values)
const queryFactionEq = readonlySet.getEq(ChampionFaction.Eq)

const fromPartial = (partial: PartialMasteriesQuery): MasteriesQuery => ({
  sort: partial.sort ?? MasteriesQuerySort.default,
  order: partial.order ?? MasteriesQueryOrder.default,
  view: partial.view ?? MasteriesQueryView.default,
  level: partial.level ?? queryLevelDefault,
  faction: partial.faction ?? queryFactionDefault,
  position: partial.position ?? queryPositionDefault,
  search: Maybe.fromNullable(partial.search),
})

const toPartial = (query: MasteriesQuery): PartialMasteriesQuery => {
  const res: MyPartial<PartialMasteriesQuery> = {
    sort: query.sort === MasteriesQuerySort.default ? undefined : query.sort,
    order: query.order === MasteriesQueryOrder.default ? undefined : query.order,
    view: query.view === MasteriesQueryView.default ? undefined : query.view,
    level: queryLevelEq.equals(query.level, queryLevelDefault) ? undefined : query.level,
    faction: queryFactionEq.equals(query.faction, queryFactionDefault) ? undefined : query.faction,
    position: queryPositionEq.equals(query.position, queryPositionDefault)
      ? undefined
      : query.position,
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
  faction: pipe(lens.id<MasteriesQuery>(), lens.prop('faction')),
  position: pipe(lens.id<MasteriesQuery>(), lens.prop('position')),
  search: pipe(lens.id<MasteriesQuery>(), lens.prop('search')),
}

const MasteriesQuery = { fromPartial, toPartial, Lens }

export { MasteriesQuery }
