import type { DayJs } from '../../../shared/models/DayJs'
import type { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'

type ChampionMastery = {
  championId: ChampionKey
  championLevel: number
  championPoints: number
  lastPlayTime: DayJs
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
  tokensEarned: number
  markRequiredForNextLevel: number
}

export { ChampionMastery }
