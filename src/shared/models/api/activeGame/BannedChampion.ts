import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { ChampionKey } from '../champion/ChampionKey'

type BannedChampion = C.TypeOf<typeof codec>
type BannedChampionOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  pickTurn: C.number,
  championId: Maybe.codec(ChampionKey.codec),
})

const empty: BannedChampion = {
  pickTurn: -1,
  championId: Maybe.none,
}

const BannedChampion = { codec, empty }

export { BannedChampion, BannedChampionOutput }
