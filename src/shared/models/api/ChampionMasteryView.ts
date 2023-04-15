import * as C from 'io-ts/Codec'

import { ChampionKey } from './champion/ChampionKey'
import { ChampionLevel } from './champion/ChampionLevel'

type ChampionMasteryView = C.TypeOf<typeof codec>

const codec = C.struct({
  championId: ChampionKey.codec,
  championLevel: ChampionLevel.codec,
  championPoints: C.number,
  championPointsSinceLastLevel: C.number,
  championPointsUntilNextLevel: C.number,
  chestGranted: C.boolean,
  tokensEarned: C.number,
})

const ChampionMasteryView = { codec }

export { ChampionMasteryView }
