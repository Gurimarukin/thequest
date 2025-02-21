import { number, ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { Lang } from './models/api/Lang'
import type { Dict } from './utils/fp'
import { List, NonEmptyArray } from './utils/fp'

type SimpleChampion = {
  championLevel: number
  championPoints: number
  championPointsUntilNextLevel: number
  tokensEarned: number
}

/**
 * Mastery level 10 or more = 100%.
 *
 * It takes 75,600 points to reach level 10 (counts for half the percentage calculation).
 *
 * It takes 7 Marks of Mastery to reach level 10 (counts for the other half of the calculation).
 */
function championPercents({
  championLevel,
  championPoints,
  championPointsUntilNextLevel,
  tokensEarned,
}: SimpleChampion): number {
  if (10 < championLevel) return 100

  const pointsPercents =
    Math.min(
      // `championPointsUntilNextLevel` can be negative
      Math.min(championPoints + championPointsUntilNextLevel, championPoints) / 75600,
      1,
    ) * 50

  const tokensPercents = Math.min((Math.max(championLevel - 4, 0) + tokensEarned) / 7, 1) * 50

  return pointsPercents + tokensPercents
}

type ChampionPoints = {
  championPoints: number
}

const byPointsOrd = pipe(
  number.Ord,
  ord.contramap((c: ChampionPoints) => c.championPoints),
  ord.reverse,
)

function otpRatio(masteries: List<ChampionPoints>, totalMasteryPoints: number): number {
  return otpRatioRec(totalMasteryPoints / 2, pipe(masteries, List.sort(byPointsOrd)), 0, 0)
}

function otpRatioRec(
  threshold: number,
  masteries: List<ChampionPoints>,
  pointsAcc: number,
  countAcc: number,
): number {
  if (!List.isNonEmpty(masteries)) return countAcc

  const [head, tail] = NonEmptyArray.unprepend(masteries)
  const newPointsAcc = pointsAcc + head.championPoints
  const newCountAcc = countAcc + 1

  if (threshold <= newPointsAcc) return newCountAcc

  return otpRatioRec(threshold, tail, newPointsAcc, newCountAcc)
}

const poroLang: Dict<Lang, string> = {
  en_GB: 'en',
  fr_FR: 'fr',
}

export const Business = { championPercents, otpRatio, poroLang }
