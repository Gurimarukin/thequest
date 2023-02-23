import * as C from 'io-ts/Codec'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { SummonerId } from '../../../shared/models/api/summoner/SummonerId'

import { UserId } from './UserId'

type ChampionShardsDb = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  user: UserId.codec,
  summoner: SummonerId.codec,
  champion: ChampionKey.codec,
  count: C.number,
})

const ChampionShardsDb = { codec }

export { ChampionShardsDb }
