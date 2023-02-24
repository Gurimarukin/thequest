import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { ChampionLevelOrZero } from '../ChampionLevel'

type ChampionShardsView = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  counts: C.record(C.number), // keys: ChampionKey
  leveledUpFromNotifications: Maybe.codec(C.record(ChampionLevelOrZero.codec)), // keys: ChampionKey
})

const ChampionShardsView = { codec }

export { ChampionShardsView }
