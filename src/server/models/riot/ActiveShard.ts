import * as D from 'io-ts/Decoder'

import { Puuid } from '../../../shared/models/api/summoner/Puuid'

import { Game } from './Game'
import { Shard } from './Shard'

type ActiveShards = D.TypeOf<typeof decoder>

const decoder = D.struct({
  puuid: Puuid.codec,
  game: Game.codec,
  activeShard: Shard.decoder,
})

const ActiveShards = { decoder }

export { ActiveShards }
