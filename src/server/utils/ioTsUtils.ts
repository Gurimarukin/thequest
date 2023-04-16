import { string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'

import { DayJs } from '../../shared/models/DayJs'
import { Dict, List, Maybe } from '../../shared/utils/fp'

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

const dayJsFromNumberDecoder: Decoder<unknown, DayJs> = pipe(
  D.number,
  D.parse(n => {
    const d = DayJs.of(n)
    return DayJs.isValid(d) ? D.success(d) : D.failure(n, 'DayJsFromNumber')
  }),
)

export const DayJsFromNumber = { decoder: dayJsFromNumberDecoder }

/**
 * StrictStruct
 */

const strictStructDecoder = <A>(properties: { [K in keyof A]: Decoder<unknown, A[K]> }): Decoder<
  unknown,
  { [K_1 in keyof A]: A[K_1] }
> =>
  pipe(
    D.UnknownRecord,
    D.parse(pjo =>
      pipe(
        D.fromStruct(properties),
        D.parse(res => {
          const diff = pipe(Dict.keys(pjo), List.difference(string.Eq)(Dict.keys(res)))
          return List.isNonEmpty(diff)
            ? D.failure(pjo, pipe(diff, List.mkString('KeysNotParsed: ', ', ', '')))
            : D.success(res)
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).decode(pjo as any),
    ),
  )

export const StrictStruct = { decoder: strictStructDecoder }

/**
 * StrictPartial
 */

const strictPartialDecoder = <A>(properties: { [K in keyof A]: Decoder<unknown, A[K]> }): Decoder<
  unknown,
  Partial<{ [K_1 in keyof A]: A[K_1] }>
> =>
  pipe(
    D.UnknownRecord,
    D.parse(pjo =>
      pipe(
        D.fromPartial(properties),
        D.parse(res => {
          const diff = pipe(Dict.keys(pjo), List.difference(string.Eq)(Dict.keys(res)))
          return List.isNonEmpty(diff)
            ? D.failure(pjo, pipe(diff, List.mkString('KeysNotParsed: ', ', ', '')))
            : D.success(res)
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).decode(pjo as any),
    ),
  )

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strictPartialCodec = <P extends Dict<string, Codec<unknown, any, any>>>(
  properties: P,
): Codec<
  unknown,
  Partial<{
    [K in keyof P]: C.OutputOf<P[K]>
  }>,
  Partial<{
    [K in keyof P]: C.TypeOf<P[K]>
  }>
> =>
  C.make(
    strictPartialDecoder(properties) as Decoder<
      unknown,
      Partial<{ [K in keyof P]: C.TypeOf<P[K]> }>
    >,
    E.partial(properties),
  )

export const StrictPartial = { decoder: strictPartialDecoder, codec: strictPartialCodec }
