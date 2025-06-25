import * as C from 'io-ts/Codec'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'

import { UserId } from './UserId'

type ChampionShardsDb = C.TypeOf<typeof codec>

type ChampionShardsDbOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  user: UserId.codec,
  summoner: Puuid.codec,
  champion: ChampionKey.codec,
  count: C.number,
})

const ChampionShardsDb = { codec }

export { ChampionShardsDb, ChampionShardsDbOutput }
