import { readonlySet } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { MyPartial } from '../../../shared/models/MyPartial'
import { ChampionFactionOrNone } from '../../../shared/models/api/champion/ChampionFaction'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
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
  level: ReadonlySet<ChampionLevel>
  faction: ReadonlySet<ChampionFactionOrNone>
  position: ReadonlySet<ChampionPosition>
  search: Maybe<string>
}

const levelDefault: ReadonlySet<ChampionLevel> = new Set(
  pipe(
    ChampionLevel.values,
    List.filter(l => l !== 7),
  ),
)
const levelEq = readonlySet.getEq(ChampionLevel.Eq)

const positionDefault: ReadonlySet<ChampionPosition> = new Set(ChampionPosition.values)
const positionEq = readonlySet.getEq(ChampionPosition.Eq)

const factionDefault: ReadonlySet<ChampionFactionOrNone> = new Set(ChampionFactionOrNone.values)
const factionEq = readonlySet.getEq(ChampionFactionOrNone.Eq)

const fromPartial = (partial: PartialMasteriesQuery): MasteriesQuery => ({
  sort: partial.sort ?? MasteriesQuerySort.default,
  order: partial.order ?? MasteriesQueryOrder.default,
  view: partial.view ?? MasteriesQueryView.default,
  level: partial.level ?? levelDefault,
  faction: partial.faction ?? factionDefault,
  position: partial.position ?? positionDefault,
  search: Maybe.fromNullable(partial.search),
})

const toPartial = (query: MasteriesQuery): PartialMasteriesQuery => {
  const res: MyPartial<PartialMasteriesQuery> = {
    sort: query.sort === MasteriesQuerySort.default ? undefined : query.sort,
    order: query.order === MasteriesQueryOrder.default ? undefined : query.order,
    view: query.view === MasteriesQueryView.default ? undefined : query.view,
    level: levelEq.equals(query.level, levelDefault) ? undefined : query.level,
    faction: factionEq.equals(query.faction, factionDefault) ? undefined : query.faction,
    position: positionEq.equals(query.position, positionDefault) ? undefined : query.position,
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
