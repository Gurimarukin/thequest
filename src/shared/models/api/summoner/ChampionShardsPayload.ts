import * as C from 'io-ts/Codec'

import { ChampionKey } from '../ChampionKey'
import { ShardsCount } from '../ShardsCount'

type ChampionShardsPayload = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  championId: ChampionKey.codec,
  shardsCount: ShardsCount.codec,
})

const ChampionShardsPayload = { codec }

export { ChampionShardsPayload }
