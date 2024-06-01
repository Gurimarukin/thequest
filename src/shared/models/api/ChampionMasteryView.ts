import * as C from 'io-ts/Codec'

import { ChampionKey } from './champion/ChampionKey'

type ChampionMasteryView = C.TypeOf<typeof codec>

const codec = C.struct({
  championId: ChampionKey.codec,
  championLevel: C.number,
  championPoints: C.number,
  championPointsSinceLastLevel: C.number,
  championPointsUntilNextLevel: C.number,
  tokensEarned: C.number,
  markRequiredForNextLevel: C.number,
})

const ChampionMasteryView = { codec }

export { ChampionMasteryView }
