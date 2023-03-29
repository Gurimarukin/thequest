import * as D from 'io-ts/Decoder'

import { Game } from './Game'
import { Puuid } from './Puuid'
import { Shard } from './Shard'

type ActiveShards = Readonly<D.TypeOf<typeof decoder>>

const decoder = D.struct({
  puuid: Puuid.codec,
  game: Game.codec,
  activeShard: Shard.decoder,
})

const ActiveShards = { decoder }

export { ActiveShards }
