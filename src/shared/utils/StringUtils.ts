import { pipe } from 'fp-ts/function'

import { DayJs } from '../models/DayJs'
import { MsDuration } from '../models/MsDuration'

const margin = /^\s*\|/gm
const stripMargins = (str: string): string => str.replace(margin, '')

const ellipse =
  (take: number) =>
  (str: string): string =>
    take < str.length && 3 <= take ? `${str.slice(0, take - 3)}...` : str

const padStart =
  (maxLength: number) =>
  (n: number): string =>
    `${n}`.padStart(maxLength, '0')

const pad10 = padStart(2)
const pad100 = padStart(3)

const plural = (n: number, unit: string): string =>
  `${n.toLocaleString()} ${unit}${n < 2 ? '' : 's'}`

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

export const StringUtils = { ellipse, stripMargins, plural, prettyMs }
