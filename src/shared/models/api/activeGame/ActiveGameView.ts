import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

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

const Lens = {
  participants: pipe(lens.id<ActiveGameView>(), lens.prop('participants')),
}

const ActiveGameView = { codec, Lens }

export { ActiveGameView }
