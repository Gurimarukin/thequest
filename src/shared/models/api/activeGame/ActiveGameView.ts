import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import { MapId } from '../MapId'
import { ChampionKey } from '../champion/ChampionKey'
import { ActiveGameParticipantView } from './ActiveGameParticipantView'
import { GameQueue } from './GameQueue'
import { TeamId } from './TeamId'

type ActiveGameView = C.TypeOf<typeof codec>

const codec = C.struct({
  gameStartTime: DayJsFromISOString.codec,
  mapId: MapId.codec,
  gameQueueConfigId: GameQueue.codec,
  bannedChampions: List.codec(
    C.struct({
      pickTurn: C.number,
      championId: ChampionKey.codec,
      teamId: TeamId.codec,
    }),
  ),
  participants: List.codec(ActiveGameParticipantView.codec),
})

const ActiveGameView = { codec }

export { ActiveGameView }
