import * as C from 'io-ts/Codec'

import { NonEmptyArray } from '../../../utils/fp'
import { ShardsCount } from '../ShardsCount'
import { ChampionKey } from '../champion/ChampionKey'

type ChampionShard = C.TypeOf<typeof shardCodec>

const shardCodec = C.struct({
  championId: ChampionKey.codec,
  shardsCount: ShardsCount.codec,
})

const ChampionShard = { codec: shardCodec }

export { ChampionShard }

type ChampionShardsPayload = C.TypeOf<typeof codec>

const codec = NonEmptyArray.codec(ChampionShard.codec)

const ChampionShardsPayload = { codec }

export { ChampionShardsPayload }
