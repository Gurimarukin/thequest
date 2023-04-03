import type { DayJs } from '../../../shared/models/DayJs'
import type { ChampionKey } from '../../../shared/models/api/ChampionKey'
import type { ChampionLevel } from '../../../shared/models/api/ChampionLevel'

type ChampionMastery = {
  championId: ChampionKey
  championLevel: ChampionLevel
  championPoints: number
  lastPlayTime: DayJs
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
  chestGranted: boolean
  tokensEarned: number
}

export { ChampionMastery }
