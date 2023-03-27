import type { DayJs } from '../../../shared/models/DayJs'
import type { ChampionKey } from '../../../shared/models/api/ChampionKey'
import type { ChampionLevel } from '../../../shared/models/api/ChampionLevel'

type ChampionMastery = {
  readonly championId: ChampionKey
  readonly championLevel: ChampionLevel
  readonly championPoints: number
  readonly lastPlayTime: DayJs
  readonly championPointsSinceLastLevel: number
  readonly championPointsUntilNextLevel: number
  readonly chestGranted: boolean
  readonly tokensEarned: number
}

export { ChampionMastery }
