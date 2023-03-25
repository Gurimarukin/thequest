import type { ChampionLevelOrZero } from './models/api/ChampionLevel'

type SimpleChampion = {
  readonly championLevel: ChampionLevelOrZero
  readonly championPoints: number
  readonly tokensEarned: number
}

// Mastery 5: 50%
// Mastery 6 tokens: 7% each
// Mastery 7 tokens: 10% each
// Shards (not based on user's favorites): 3% each
const championPercents = (c: SimpleChampion): number => {
  if (c.championLevel === 7) return 100

  // 6-0: 67%, 6-1: 77%, 6-2: 87%, 6-3: 97%
  if (c.championLevel === 6) return 67 + c.tokensEarned * 10

  // 5-0: 50%, 5-1: 57%, 5-2: 64%
  if (c.championLevel === 5) return 50 + c.tokensEarned * 7

  return (c.championPoints / 21600) * 50
}

export const Business = { championPercents }
