import * as C from 'io-ts/Codec'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'

import { SummonerId } from '../summoner/SummonerId'
import { UserId } from './UserId'

type ChampionShardsDb = C.TypeOf<typeof codec>

type ChampionShardsDbOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  user: UserId.codec,
  summoner: SummonerId.codec,
  champion: ChampionKey.codec,
  count: C.number,
  updatedWhenChampionLevel: ChampionLevel.codec,
})

const ChampionShardsDb = { codec }

export { ChampionShardsDb, ChampionShardsDbOutput }
