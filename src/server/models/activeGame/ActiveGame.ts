import type { DayJs } from '../../../shared/models/DayJs'
import type { MapId } from '../../../shared/models/api/MapId'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import type { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import type { GameId } from '../riot/GameId'
import type { ActiveGameParticipant } from './ActiveGameParticipant'

type ActiveGame = {
  gameId: GameId
  gameStartTime: Maybe<DayJs>
  mapId: MapId
  gameQueueConfigId: GameQueue
  isDraft: boolean
  participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipant>>
  insertedAt: DayJs
}

const toView =
  (participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipantView>>) =>
  (game: ActiveGame): ActiveGameView => ({
    ...game,
    participants,
  })

const ActiveGame = { toView }

export { ActiveGame }
