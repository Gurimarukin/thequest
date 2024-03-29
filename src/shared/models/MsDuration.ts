// import type { StringValue } from 'ms'
// import vercelMs from 'ms'
import { number, ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

type MsDuration = Newtype<{ readonly MsDuration: unique symbol }, number>

const { wrap, unwrap } = iso<MsDuration>()
const milliseconds = wrap

const codec: Codec<unknown, number, MsDuration> = C.make(
  pipe(C.number, D.map(wrap)),
  pipe(C.number, E.contramap(unwrap)),
)

// const fromStringDecoder = pipe(
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

const infinity: MsDuration = milliseconds(Infinity)

const seconds = (n: number): MsDuration => milliseconds(1000 * n)
const minutes = (n: number): MsDuration => seconds(60 * n)
const hours = (n: number): MsDuration => minutes(60 * n)
const days = (n: number): MsDuration => hours(24 * n)

const fromDate = (date: Date): MsDuration => milliseconds(date.getTime())

const add =
  (b: MsDuration) =>
  (a: MsDuration): MsDuration =>
    milliseconds(unwrap(a) + unwrap(b))

const Ord: ord.Ord<MsDuration> = pipe(number.Ord, ord.contramap(unwrap))

const MsDuration = {
  codec,
  // fromStringDecoder,
  // fromString,
  infinity,
  millisecond: milliseconds,
  milliseconds,
  unwrap,
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
  Ord,
}

export { MsDuration }
