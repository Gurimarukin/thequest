import * as C from 'io-ts/Codec'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { List } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'

type ChampionMasteryDb = C.TypeOf<typeof codec>
type ChampionMasteryDbOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  puuid: Puuid.codec,
  champions: List.codec(
    C.struct({
      championId: ChampionKey.codec,
      championLevel: C.number,
      championPoints: C.number,
      lastPlayTime: DayJsFromDate.codec,
      championPointsSinceLastLevel: C.number,
      championPointsUntilNextLevel: C.number,
      tokensEarned: C.number,
      markRequiredForNextLevel: C.number,
    }),
  ),
  insertedAt: DayJsFromDate.codec,
})

const ChampionMasteryDb = { codec }

export { ChampionMasteryDb, ChampionMasteryDbOutput }
