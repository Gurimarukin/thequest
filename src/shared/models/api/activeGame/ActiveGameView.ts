import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import type { Dict } from '../../../utils/fp'
import { NonEmptyArray } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import { MapId } from '../MapId'
import type { ActiveGameParticipantViewOutput } from './ActiveGameParticipantView'
import { ActiveGameParticipantView } from './ActiveGameParticipantView'
import { GameQueue } from './GameQueue'
import type { TeamId } from './TeamId'

type ActiveGameView = C.TypeOf<typeof codec>

const participantsProperties: Dict<
  `${TeamId}`,
  Codec<
    unknown,
    NonEmptyArray<ActiveGameParticipantViewOutput>,
    NonEmptyArray<ActiveGameParticipantView>
  >
> = {
  100: NonEmptyArray.codec(ActiveGameParticipantView.codec),
  200: NonEmptyArray.codec(ActiveGameParticipantView.codec),
}

const codec = C.struct({
  gameStartTime: DayJsFromISOString.codec,
  mapId: MapId.codec,
  gameQueueConfigId: GameQueue.codec,
  isDraft: C.boolean,
  participants: C.readonly(C.partial(participantsProperties)),
})

const ActiveGameView = { codec }

export { ActiveGameView }
