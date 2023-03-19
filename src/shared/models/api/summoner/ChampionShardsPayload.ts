import * as C from 'io-ts/Codec'

import { ChampionKey } from '../ChampionKey'

type ChampionShardsPayload = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  championKey: ChampionKey.codec,
  shardsCount: C.number,
})

const ChampionShardsPayload = { codec }

export { ChampionShardsPayload }
