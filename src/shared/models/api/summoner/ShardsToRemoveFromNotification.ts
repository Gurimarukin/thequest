import * as C from 'io-ts/Codec'

import { ChampionLevelOrZero } from '../champion/ChampionLevel'

type ShardsToRemoveFromNotification = C.TypeOf<typeof codec>

const codec = C.struct({
  leveledUpFrom: ChampionLevelOrZero.codec,
  shardsToRemove: C.number,
})

const ShardsToRemoveFromNotification = { codec }

export { ShardsToRemoveFromNotification }
