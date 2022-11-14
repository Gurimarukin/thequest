import * as C from 'io-ts/Codec'

import { ChampionKey } from './ChampionKey'

type ChampionMasteryView = C.TypeOf<typeof codec>

const codec = C.struct({
  championId: ChampionKey.codec,
  championLevel: C.number,
  championPoints: C.number,
  championPointsSinceLastLevel: C.number,
  championPointsUntilNextLevel: C.number,
  chestGranted: C.boolean,
  tokensEarned: C.number,
})

const ChampionMasteryView = { codec }

export { ChampionMasteryView }
