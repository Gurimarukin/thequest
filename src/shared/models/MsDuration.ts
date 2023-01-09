// import type { StringValue } from 'ms'
// import vercelMs from 'ms'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

type MsDuration = Newtype<{ readonly MsDuration: unique symbol }, number>

const { wrap, unwrap } = iso<MsDuration>()

// const decoder = pipe(
//   D.string,
//   D.parse(str =>
//     pipe(
//       fromString(str),
//       either.fromOption(() => D.error(str, 'MsDuration')),
//     ),
//   ),
// )

// const fromString = (str: string): Option<MsDuration> =>
//   pipe(
//     option.tryCatch(() => vercelMs(str as StringValue)),
//     option.filter(predicate.not(isNaN)),
//     option.map(wrap),
//   )

const seconds = (n: number): MsDuration => wrap(1000 * n)
const minutes = (n: number): MsDuration => seconds(60 * n)
const hours = (n: number): MsDuration => minutes(60 * n)
const days = (n: number): MsDuration => hours(24 * n)

const fromDate = (date: Date): MsDuration => wrap(date.getTime())

const add =
  (b: MsDuration) =>
  (a: MsDuration): MsDuration =>
    wrap(unwrap(a) + unwrap(b))

const MsDuration = {
  wrap,
  unwrap,
  // decoder,
  // fromString,
  seconds,
  second: seconds,
  minutes,
  minute: minutes,
  hours,
  hour: hours,
  days,
  day: days,
  fromDate,
  add,
}

export { MsDuration }
