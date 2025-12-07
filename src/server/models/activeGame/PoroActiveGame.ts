import type { GameId } from '../../../shared/models/api/GameId'
import type { List } from '../../../shared/utils/fp'

import type { PoroActiveGameParticipant } from './PoroActiveGameParticipant'

type PoroActiveGame = {
  gameId: GameId
  participants: List<PoroActiveGameParticipant>
}

export { PoroActiveGame }
