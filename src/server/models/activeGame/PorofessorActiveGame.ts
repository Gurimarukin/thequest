import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import type { GameId } from '../riot/GameId'
import type { PorofessorActiveGameParticipant } from './PorofessorActiveGameParticipant'

type PorofessorActiveGame = {
  gameId: GameId
  participants: PartialDict<`${TeamId}`, NonEmptyArray<PorofessorActiveGameParticipant>>
}

export { PorofessorActiveGame }
