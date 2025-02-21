import { ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { StringUtils } from '../../../utils/StringUtils'
import { List, Maybe } from '../../../utils/fp'
import { MapChangesData } from '../MapChangesData'
import type { ChampionFactionOrNone } from '../champion/ChampionFaction'
import { ChampionFaction } from '../champion/ChampionFaction'
import { ChampionId } from '../champion/ChampionId'
import { ChampionKey } from '../champion/ChampionKey'
import { ChampionPosition } from '../champion/ChampionPosition'

type StaticDataChampion = C.TypeOf<typeof codec>

const codec = C.struct({
  id: ChampionId.codec,
  key: ChampionKey.codec,
  name: C.string,
  positions: List.codec(ChampionPosition.codec),
  factions: List.codec(ChampionFaction.codec),
  aram: MapChangesData.codec,
  urf: MapChangesData.codec,
})

const getFaction: (factions: List<ChampionFaction>) => ChampionFactionOrNone = flow(
  List.head,
  Maybe.getOrElse<ChampionFactionOrNone>(() => 'none'),
)

const byName: Ord<StaticDataChampion> = pipe(
  string.Ord,
  ord.contramap((c: StaticDataChampion) => StringUtils.cleanUTF8ToASCII(c.name)),
)

const aramLens = pipe(lens.id<StaticDataChampion>(), lens.prop('aram'))
const urfLens = pipe(lens.id<StaticDataChampion>(), lens.prop('urf'))

const Lens = {
  aram: aramLens,
  aramSpells: pipe(aramLens, lens.prop('spells')),
  urf: urfLens,
  urfSpells: pipe(urfLens, lens.prop('spells')),
}

const StaticDataChampion = { codec, getFaction, Ord: { byName }, Lens }

export { StaticDataChampion }
