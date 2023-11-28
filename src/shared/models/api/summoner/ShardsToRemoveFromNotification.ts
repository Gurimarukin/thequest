import * as C from 'io-ts/Codec'

import { ChampionLevel } from '../champion/ChampionLevel'

type ShardsToRemoveFromNotification = C.TypeOf<typeof codec>

const codec = C.struct({
  leveledUpFrom: ChampionLevel.codec,
  shardsToRemove: C.number,
})

const ShardsToRemoveFromNotification = { codec }

export { ShardsToRemoveFromNotification }
