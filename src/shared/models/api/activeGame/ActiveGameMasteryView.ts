import * as C from 'io-ts/Codec'

import { ChampionLevel } from '../champion/ChampionLevel'

type ActiveGameMasteryView = C.TypeOf<typeof codec>

const codec = C.struct({
  level: ChampionLevel.codec,
  points: C.number,
  pointsSinceLastLevel: C.number,
  pointsUntilNextLevel: C.number,
  chestGranted: C.boolean,
  tokensEarned: C.number,
})

const ActiveGameMasteryView = { codec }

export { ActiveGameMasteryView }
