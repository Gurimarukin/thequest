import * as C from 'io-ts/Codec'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
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
      championLevel: ChampionLevel.codec,
      championPoints: C.number,
      lastPlayTime: DayJsFromDate.codec,
      championPointsSinceLastLevel: C.number,
      championPointsUntilNextLevel: C.number,
      chestGranted: C.boolean,
      tokensEarned: C.number,
    }),
  ),
  insertedAt: DayJsFromDate.codec,
})

const ChampionMasteryDb = { codec }

export { ChampionMasteryDb, ChampionMasteryDbOutput }
