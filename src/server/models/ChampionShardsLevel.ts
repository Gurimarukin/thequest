import type { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'

export type ChampionShardsLevel = {
  championId: ChampionKey
  shardsCount: number
  championLevel: ChampionLevelOrZero
}
