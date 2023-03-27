import type { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'

export type ChampionShardsLevel = {
  readonly championId: ChampionKey
  readonly shardsCount: number
  readonly championLevel: ChampionLevelOrZero
}
