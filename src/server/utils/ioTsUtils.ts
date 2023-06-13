import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'

import { DayJs } from '../../shared/models/DayJs'
import { Maybe } from '../../shared/utils/fp'

/**
 * DayJsFromDate
 */

const dayJsFromDateDecoder: Decoder<unknown, DayJs> = {
  decode: i =>
    pipe(
      i,
      Maybe.fromPredicate((u): u is Date => u instanceof Date),
      Maybe.map(d => DayJs.of(d)),
      Maybe.filter(DayJs.isValid),
      Maybe.fold(() => D.failure(i, 'DayJsFromDate'), D.success),
    ),
}

const dayJsFromDateEncoder: Encoder<Date, DayJs> = { encode: DayJs.toDate }

const dayJsFromDateCodec: Codec<unknown, Date, DayJs> = C.make(
  dayJsFromDateDecoder,
  dayJsFromDateEncoder,
)

export const DayJsFromDate = {
  decoder: dayJsFromDateDecoder,
  encoder: dayJsFromDateEncoder,
  codec: dayJsFromDateCodec,
}

/**
 * DayJsFromNumber
 */

const dayJsFromNumberNumberDecoder: Decoder<number, DayJs> = {
  decode: n => {
    const d = DayJs.of(n)
    return DayJs.isValid(d) ? D.success(d) : D.failure(n, 'DayJsFromNumber')
  },
}

const dayJsFromNumberDecoder: Decoder<unknown, DayJs> = pipe(
  D.number,
  D.compose(dayJsFromNumberNumberDecoder),
)

export const DayJsFromNumber = {
  decoder: dayJsFromNumberDecoder,
  numberDecoder: dayJsFromNumberNumberDecoder,
}
