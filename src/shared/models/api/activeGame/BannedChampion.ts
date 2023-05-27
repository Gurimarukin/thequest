import * as C from 'io-ts/Codec'

import { ChampionKey } from '../champion/ChampionKey'
import { TeamId } from './TeamId'

type BannedChampion = C.TypeOf<typeof codec>

const codec = C.struct({
  pickTurn: C.number,
  championId: ChampionKey.codec,
  teamId: TeamId.codec,
})

const BannedChampion = { codec }

export { BannedChampion }
