import * as C from 'io-ts/Codec'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'

import { SummonerId } from '../summoner/SummonerId'
import { UserId } from './UserId'

type ChampionShardsDb = C.TypeOf<typeof codec>

type ChampionShardsDbOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  user: UserId.codec,
  summoner: SummonerId.codec,
  champion: ChampionKey.codec,
  count: C.number,
  updatedWhenChampionLevel: ChampionLevelOrZero.codec,
})

const ChampionShardsDb = { codec }

export { ChampionShardsDb, ChampionShardsDbOutput }
