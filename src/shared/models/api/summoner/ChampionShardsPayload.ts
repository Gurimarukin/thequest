import * as C from 'io-ts/Codec'

import { ShardsCount } from '../ShardsCount'
import { ChampionKey } from '../champion/ChampionKey'

type ChampionShardsPayload = C.TypeOf<typeof codec>

const codec = C.struct({
  championId: ChampionKey.codec,
  shardsCount: ShardsCount.codec,
})

const ChampionShardsPayload = { codec }

export { ChampionShardsPayload }
