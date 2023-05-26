import * as C from 'io-ts/Codec'

import { ChampionLevel } from '../champion/ChampionLevel'

type ActiveGameChampionMasteryView = C.TypeOf<typeof codec>

const codec = C.struct({
  championLevel: ChampionLevel.codec,
  championPoints: C.number,
  championPointsSinceLastLevel: C.number,
  championPointsUntilNextLevel: C.number,
  chestGranted: C.boolean,
  tokensEarned: C.number,
})

const ActiveGameChampionMasteryView = { codec }

export { ActiveGameChampionMasteryView }
