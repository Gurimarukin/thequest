import { monoid, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { List } from '../../shared/utils/fp'

const average = (ns: List<number>): number =>
  ns.length === 0 ? 0 : pipe(ns, monoid.concatAll(number.MonoidSum)) / ns.length

const round = (n: number, digits = 0): number => {
  const e = 10 ** digits
  return e === 0 ? 0 : Math.round(n * e) / e
}

export const NumberUtils = { round, average }
