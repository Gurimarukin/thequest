import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'

export type ChampionShardsLevel = {
  championId: ChampionKey
  shardsCount: number
  championLevel: number
}
