import * as C from 'io-ts/Codec'

import { ChampionId } from './ChampionId'
import { ChampionKey } from './ChampionKey'

type StaticDataChampion = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  id: ChampionId.codec,
  key: ChampionKey.codec,
  name: C.string,
})

const StaticDataChampion = { codec }

export { StaticDataChampion }
