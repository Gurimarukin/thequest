import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import type { Dict } from '../../../utils/fp'
import { Maybe, NonEmptyArray } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import type { ActiveGameParticipantViewOutput } from './ActiveGameParticipantView'
import { ActiveGameParticipantView } from './ActiveGameParticipantView'
import type { BannedChampionOutput } from './BannedChampion'
import { BannedChampion } from './BannedChampion'
import type { TeamId } from './TeamId'

type ActiveGameView = C.TypeOf<typeof codec>

const bannedChampionsProperties: Dict<
  `${TeamId}`,
  Codec<unknown, NonEmptyArray<BannedChampionOutput>, NonEmptyArray<BannedChampion>>
> = {
  100: NonEmptyArray.codec(BannedChampion.codec),
  200: NonEmptyArray.codec(BannedChampion.codec),
}

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
  gameStartTime: Maybe.codec(DayJsFromISOString.codec),
  /** MapId */
  mapId: C.number,
  /** GameMode */
  gameMode: C.string,
  /** GameQueue */
  gameQueueConfigId: C.number,
  isDraft: C.boolean,
  bannedChampions: C.readonly(C.partial(bannedChampionsProperties)),
  participants: C.readonly(C.partial(participantsProperties)),
  isPoroOK: C.boolean,
})

const ActiveGameView = { codec }

export { ActiveGameView }
