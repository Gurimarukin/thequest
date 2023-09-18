import { number, ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { ChampionLevelOrZero } from './models/api/champion/ChampionLevel'
import { List, NonEmptyArray } from './utils/fp'

type SimpleChampion = {
  championLevel: ChampionLevelOrZero
  championPoints: number
  tokensEarned: number
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

type ChampionPoints = {
  championPoints: number
}

const byPointsOrd = pipe(
  number.Ord,
  ord.contramap((c: ChampionPoints) => c.championPoints),
  ord.reverse,
)

const otpRatio = (masteries: List<ChampionPoints>, totalMasteryPoints: number): number =>
  otpRatioRec(totalMasteryPoints / 2, pipe(masteries, List.sort(byPointsOrd)), 0, 0)

const otpRatioRec = (
  threshold: number,
  masteries: List<ChampionPoints>,
  pointsAcc: number,
  countAcc: number,
): number => {
  if (!List.isNonEmpty(masteries)) return countAcc

  const [head, tail] = NonEmptyArray.unprepend(masteries)
  const newPointsAcc = pointsAcc + head.championPoints
  const newCountAcc = countAcc + 1

  if (threshold <= newPointsAcc) return newCountAcc

  return otpRatioRec(threshold, tail, newPointsAcc, newCountAcc)
}

export const Business = { championPercents, otpRatio }
