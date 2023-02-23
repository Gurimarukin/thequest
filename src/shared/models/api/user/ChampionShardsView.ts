import * as C from 'io-ts/Codec'

import { ChampionKey } from '../ChampionKey'

type ChampionShardsView = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  champion: ChampionKey.codec,
  count: C.number,
})

const ChampionShardsView = { codec }

export { ChampionShardsView }
