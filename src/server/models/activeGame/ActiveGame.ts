import type { DayJs } from '../../../shared/models/DayJs'
import type { MapId } from '../../../shared/models/api/MapId'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import type { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import type { GameId } from '../riot/GameId'
import type { ActiveGameParticipant } from './ActiveGameParticipant'

type ActiveGame = {
  gameId: GameId
  gameStartTime: DayJs
  mapId: MapId
  gameQueueConfigId: GameQueue
  isDraft: boolean
  participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipant>>
}

const toView =
  (participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipantView>>) =>
  (g: ActiveGame): ActiveGameView => ({
    ...g,
    participants,
  })

const ActiveGame = { toView }

export { ActiveGame }
