import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'

export type ChampionShardsLevel = {
  championId: ChampionKey
  shardsCount: number
  championLevel: ChampionLevel
}
