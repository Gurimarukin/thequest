import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { List } from '../../../utils/fp'
import { AramData } from '../AramData'
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
  aram: AramData.codec,
})

const Lens = {
  aramSpells: pipe(lens.id<StaticDataChampion>(), lens.prop('aram'), lens.prop('spells')),
}

const StaticDataChampion = { codec, Lens }

export { StaticDataChampion }
