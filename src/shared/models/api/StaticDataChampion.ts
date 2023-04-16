import * as C from 'io-ts/Codec'

import { List } from '../../utils/fp'
import { AramData } from './AramData'
import { ChampionId } from './champion/ChampionId'
import { ChampionKey } from './champion/ChampionKey'
import { ChampionPosition } from './champion/ChampionPosition'

type StaticDataChampion = C.TypeOf<typeof codec>

const codec = C.struct({
  id: ChampionId.codec,
  key: ChampionKey.codec,
  name: C.string,
  positions: List.codec(ChampionPosition.codec),
  aram: AramData.codec,
})

const StaticDataChampion = { codec }

export { StaticDataChampion }
