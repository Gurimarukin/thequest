import { pipe } from 'fp-ts/function'

import { DayJs } from '../models/DayJs'
import { MsDuration } from '../models/MsDuration'
import type { Tuple, Tuple3 } from './fp'
import { Maybe } from './fp'

const margin = /^\s*\|/gm
const stripMargins = (str: string): string => str.replace(margin, '')

const ellipse =
  (take: number) =>
  (str: string): string =>
    take < str.length && 3 <= take ? `${str.slice(0, take - 3)}...` : str

const matcher =
  <A>(regex: RegExp, f: (arr: RegExpMatchArray) => A) =>
  (str: string): Maybe<A> =>
    pipe(str.match(regex), Maybe.fromNullable, Maybe.map(f))

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const matcher1 = (regex: RegExp): ((str: string) => Maybe<string>) => matcher(regex, ([, a]) => a!)

const matcher2 = (regex: RegExp): ((str: string) => Maybe<Tuple<string, string>>) =>
  matcher(regex, ([, a, b]) => [a, b] as Tuple<string, string>)

const matcher3 = (regex: RegExp): ((str: string) => Maybe<Tuple3<string, string, string>>) =>
  matcher(regex, ([, a, b, c]) => [a, b, c] as Tuple3<string, string, string>)

const padStart =
  (maxLength: number) =>
  (n: number): string =>
    `${n}`.padStart(maxLength, '0')

const pad10 = padStart(2)
const pad100 = padStart(3)

const cleanUTF8ToASCII = (str: string): string =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const whiteSpaces = /\s+/g
const cleanWhitespaces = (str: string): string => str.replace(whiteSpaces, ' ')

const nonAZ = /[^a-z]/g
const cleanChampionName = (name: string): string =>
  StringUtils.cleanUTF8ToASCII(name).toLowerCase().replaceAll(nonAZ, '')

const cleanHtml = (str: string): string =>
  cleanWhitespaces(
    str
      // newline please
      .trim()
      .normalize(),
  )

const prettyMs = (ms: MsDuration): string => {
  const date = DayJs.of(MsDuration.unwrap(ms))
  const zero = DayJs.of(0)

  const d = pipe(date, DayJs.diff(zero, 'days'))
  const h = DayJs.hour.get(date)
  const m = DayJs.minute.get(date)
  const s = DayJs.second.get(date)
  const ms_ = DayJs.millisecond.get(date)

  if (d !== 0) return `${d}d${pad10(h)}h${pad10(m)}'${pad10(s)}.${pad100(ms_)}"`
  if (h !== 0) return `${pad10(h)}h${pad10(m)}'${pad10(s)}.${pad100(ms_)}"`
  if (m !== 0) return `${pad10(m)}'${pad10(s)}.${pad100(ms_)}"`
  return `${pad10(s)}.${pad100(ms_)}"`
}

const toLowerCase = <K extends string>(str: K): Lowercase<K> => str.toLowerCase() as Lowercase<K>
const toUpperCase = <K extends string>(str: K): Uppercase<K> => str.toUpperCase() as Uppercase<K>

export const StringUtils = {
  ellipse,
  matcher1,
  matcher2,
  matcher3,
  stripMargins,
  pad10,
  cleanUTF8ToASCII,
  cleanChampionName,
  cleanHtml,
  prettyMs,
  toLowerCase,
  toUpperCase,
}
