import { json, ord, predicate, readonlySet, string } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import type { Predicate } from 'fp-ts/Predicate'
import type { Refinement } from 'fp-ts/Refinement'
import { flow, identity, pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { DecodeError, Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'
import type { AnyNewtype, CarrierOf } from 'newtype-ts'

import { DayJs } from '../models/DayJs'
import { DictUtils } from './DictUtils'
import { StringUtils } from './StringUtils'
import type { Dict } from './fp'
import { Either, List, Maybe, NonEmptyArray } from './fp'

const limit = 10000

export const decodeError =
  (name: string) =>
  (value: unknown) =>
  (error: DecodeError): Error =>
    Error(
      StringUtils.stripMargins(
        `Couldn't decode ${name}:
        |Error:
        |${pipe(D.draw(error), StringUtils.ellipse(limit))}
        |
        |Value: ${pipe(
          json.stringify(value),
          Either.getOrElse(() => `${value}`),
          StringUtils.ellipse(limit),
        )}`,
      ),
    )

export const fromNewtype = <N extends AnyNewtype = never>(
  codec: Codec<unknown, CarrierOf<N>, CarrierOf<N>>,
): Codec<unknown, CarrierOf<N>, N> => codec

/**
 * NonEmptyString
 */

const nonEmptyStringDecoder: Decoder<unknown, string> = pipe(
  D.string,
  D.refine((str): str is string => !string.isEmpty(str), 'NonEmptyString'),
)

const nonEmptyStringEncoder: Encoder<string, string> = E.id<string>()

const nonEmptyStringCodec: Codec<unknown, string, string> = C.make(
  nonEmptyStringDecoder,
  nonEmptyStringEncoder,
)

export const NonEmptyString = {
  decoder: nonEmptyStringDecoder,
  encoder: nonEmptyStringEncoder,
  codec: nonEmptyStringCodec,
}

/**
 * DayJsFromISOString
 */

const dayJsFromISOStringDecoder: Decoder<unknown, DayJs> = pipe(
  D.string,
  D.parse(str => {
    const d = DayJs.of(str)
    return DayJs.isValid(d) ? D.success(d) : D.failure(str, 'DayJsFromISOString')
  }),
)

const dayJsFromISOStringEncoder: Encoder<string, DayJs> = { encode: DayJs.toISOString }

const dayJsFromISOStringCodec: Codec<unknown, string, DayJs> = C.make(
  dayJsFromISOStringDecoder,
  dayJsFromISOStringEncoder,
)

export const DayJsFromISOString = {
  decoder: dayJsFromISOStringDecoder,
  encoder: dayJsFromISOStringEncoder,
  codec: dayJsFromISOStringCodec,
}

/**
 * URLFromString
 */

const urlFromStringDecoder: Decoder<unknown, URL> = pipe(
  D.string,
  D.parse(s =>
    pipe(
      Maybe.tryCatch(() => new URL(s)),
      Maybe.fold(() => D.failure(s, 'URLFromString'), D.success),
    ),
  ),
)

export const URLFromString = { decoder: urlFromStringDecoder }

/**
 * BooleanFromString
 */

const booleanFromStringDecoder: Decoder<unknown, boolean> = pipe(
  D.string,
  D.parse(s =>
    s === 'true'
      ? D.success(true)
      : s === 'false'
      ? D.success(false)
      : D.failure(s, 'BooleanFromString'),
  ),
)

export const BooleanFromString = { decoder: booleanFromStringDecoder }

/**
 * NumberFromString
 */

const numberFromStringDecoder: Decoder<unknown, number> = pipe(
  D.string,
  D.parse(s => {
    const n = Number(s)
    return isNaN(n) ? D.failure(s, 'NumberFromString') : D.success(n)
  }),
)

const numberFromStringEncoder: Encoder<string, number> = pipe(E.id<string>(), E.contramap(String))

const numberFromStringCodec: Codec<unknown, string, number> = C.make(
  numberFromStringDecoder,
  numberFromStringEncoder,
)

export const NumberFromString = {
  decoder: numberFromStringDecoder,
  encoder: numberFromStringEncoder,
  codec: numberFromStringCodec,
}

/**
 * ArrayFromString
 */

const prepareArray: (i: string) => List<string> = flow(
  string.split(','),
  NonEmptyArray.map(string.trim),
  List.filter(predicate.not(string.isEmpty)),
)

const arrayFromStringDecoder = <A>(decoder: Decoder<unknown, A>): Decoder<unknown, List<A>> =>
  pipe(D.string, D.map(prepareArray), D.compose(List.decoder(decoder)))

const arrayFromStringEncoder = <A>(encoder: Encoder<string, A>): Encoder<string, List<A>> => ({
  encode: flow(List.map(encoder.encode), List.mkString(',')),
})

const arrayFromStringCodec = <A>(
  codec: Codec<unknown, string, A>,
): Codec<unknown, string, List<A>> =>
  C.make(arrayFromStringDecoder(codec), arrayFromStringEncoder(codec))

export const ArrayFromString = {
  decoder: arrayFromStringDecoder,
  encoder: arrayFromStringEncoder,
  codec: arrayFromStringCodec,
}

/**
 * SetFromString
 */

const setFromStringDecoder = <A>(
  decoder: Decoder<unknown, A>,
  eq_: Eq<A>,
): Decoder<unknown, ReadonlySet<A>> =>
  pipe(arrayFromStringDecoder(decoder), D.map(readonlySet.fromReadonlyArray(eq_)))

const setFromStringEncoder = <A>(encoder: Encoder<string, A>): Encoder<string, ReadonlySet<A>> =>
  pipe(arrayFromStringEncoder(encoder), E.contramap(readonlySet.toReadonlyArray<A>(ord.trivial)))

const setFromStringCodec = <A>(
  codec: Codec<unknown, string, A>,
  eq_: Eq<A>,
): Codec<unknown, string, ReadonlySet<A>> =>
  C.make(setFromStringDecoder(codec, eq_), setFromStringEncoder(codec))

export const SetFromString = {
  decoder: setFromStringDecoder,
  encoder: setFromStringEncoder,
  codec: setFromStringCodec,
}

/**
 * NonEmptyArrayFromString
 */

const nonEmptyArrayFromStringDecoder = <A>(
  decoder: Decoder<unknown, A>,
): Decoder<unknown, NonEmptyArray<A>> =>
  pipe(D.string, D.map(prepareArray), D.compose(NonEmptyArray.decoder(decoder)))

export const NonEmptyArrayFromString = { decoder: nonEmptyArrayFromStringDecoder }

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
          const diff = pipe(DictUtils.keys(pjo), List.difference(string.Eq)(DictUtils.keys(res)))
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
          const diff = pipe(DictUtils.keys(pjo), List.difference(string.Eq)(DictUtils.keys(res)))
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

/**
 * StrictTuple
 */

const strictTupleDecoder = <A extends List<unknown>>(
  ...components: { [K in keyof A]: Decoder<unknown, A[K]> }
): Decoder<unknown, A> =>
  pipe(
    D.UnknownArray,
    D.refine(
      refinementFromPredicate(us => us.length === components.length),
      `ArrayOfLength${components.length}`,
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    D.compose(D.fromTuple(...components) as any),
  )

export const StrictTuple = { decoder: strictTupleDecoder }

const refinementFromPredicate = identity as <A>(f: Predicate<A>) => Refinement<A, A>
