import { monoid, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { List } from './fp'

const average = (ns: List<number>): number =>
  ns.length === 0 ? 0 : pipe(ns, monoid.concatAll(number.MonoidSum)) / ns.length

const round = (n: number, digits = 0): number => {
  const e = 10 ** digits
  return e === 0 ? 0 : Math.round(n * e) / e
}

/**
 * https://github.com/lodash/lodash/blob/master/clamp.js
 *
 * Clamps `n` within the inclusive `lower` and `upper` bounds.
 *
 * @param n The number to clamp.
 * @param lower The lower bound.
 * @param upper The upper bound.
 * @returns Returns the clamped number.
 * @example
 *
 * clamp(-10, -5, 5)
 * // => -5
 *
 * clamp(10, -5, 5)
 * // => 5
 */
const clamp = (n: number, lower: number, upper: number): number => {
  // eslint-disable-next-line functional/no-let
  let res: number = n
  /* eslint-disable functional/no-expression-statements */
  res = res <= upper ? res : upper
  res = res >= lower ? res : lower
  /* eslint-enable functional/no-expression-statements */
  return res
}

export const NumberUtils = { round, average, clamp }
