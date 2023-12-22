import type { GameId } from '../../../shared/models/api/GameId'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import type { PoroActiveGameParticipant } from './PoroActiveGameParticipant'

type PoroActiveGame = {
  gameId: GameId
  participants: PartialDict<`${TeamId}`, NonEmptyArray<PoroActiveGameParticipant>>
}

export { PoroActiveGame }
