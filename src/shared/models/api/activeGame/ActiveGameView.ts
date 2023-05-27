import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import { MapId } from '../MapId'
import { ActiveGameParticipantView } from './ActiveGameParticipantView'
import { BannedChampion } from './BannedChampion'
import { GameQueue } from './GameQueue'

type ActiveGameView = C.TypeOf<typeof codec>

const codec = C.struct({
  gameStartTime: DayJsFromISOString.codec,
  mapId: MapId.codec,
  gameQueueConfigId: GameQueue.codec,
  bannedChampions: List.codec(BannedChampion.codec),
  participants: List.codec(ActiveGameParticipantView.codec),
})

const ActiveGameView = { codec }

export { ActiveGameView }
