import { createEnum } from '../../../shared/utils/createEnum'

type GameType = typeof GameType.T

const GameType = createEnum(
  'CUSTOM_GAME', // Custom games
  'TUTORIAL_GAME', // Tutorial games
  'MATCHED_GAME', // all other games
)

export { GameType }
