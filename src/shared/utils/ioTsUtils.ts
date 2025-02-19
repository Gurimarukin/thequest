import { json, predicate, readonlyMap, readonlySet, string } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import type { Ord } from 'fp-ts/Ord'
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
import { MapUtils } from './MapUtils'
import { StringUtils } from './StringUtils'
import type { Dict, Tuple } from './fp'
import { Either, List, Maybe, NonEmptyArray } from './fp'

const limit = 10000

export const decodeErrorString =
  (name: string) =>
  (value: unknown) =>
  (error: DecodeError): string =>
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
    )

export const decodeError =
  (name: string) =>
  (value: unknown) =>
  (error: DecodeError): Error =>
    Error(decodeErrorString(name)(value)(error))

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

const prepareArray = (separator: string): ((i: string) => List<string>) =>
  flow(
    string.split(separator),
    NonEmptyArray.map(string.trim),
    List.filter(predicate.not(string.isEmpty)),
  )

const arrayFromStringDecoder =
  (separator: string) =>
  <A>(decoder: Decoder<unknown, A>): Decoder<unknown, List<A>> =>
    pipe(D.string, D.map(prepareArray(separator)), D.compose(List.decoder(decoder)))

const arrayFromStringEncoder =
  (separator: string) =>
  <A>(encoder: Encoder<string, A>): Encoder<string, List<A>> => ({
    encode: flow(List.map(encoder.encode), List.mkString(separator)),
  })

const arrayFromStringCodec =
  (separator: string) =>
  <A>(codec: Codec<unknown, string, A>): Codec<unknown, string, List<A>> =>
    C.make(arrayFromStringDecoder(separator)(codec), arrayFromStringEncoder(separator)(codec))

export const ArrayFromString = {
  decoder: arrayFromStringDecoder,
  encoder: arrayFromStringEncoder,
  codec: arrayFromStringCodec,
}

/**
 * SetFromString
 */

const setFromStringDecoder =
  (separator: string) =>
  <A>(decoder: Decoder<unknown, A>, eq_: Eq<A>): Decoder<unknown, ReadonlySet<A>> =>
    pipe(arrayFromStringDecoder(separator)(decoder), D.map(readonlySet.fromReadonlyArray(eq_)))

const setFromStringEncoder =
  (separator: string) =>
  <A>(ord: Ord<A>) =>
  (encoder: Encoder<string, A>): Encoder<string, ReadonlySet<A>> =>
    pipe(arrayFromStringEncoder(separator)(encoder), E.contramap(readonlySet.toReadonlyArray(ord)))

const setFromStringCodec =
  (separator: string) =>
  <A>(codec: Codec<unknown, string, A>, ord: Ord<A>): Codec<unknown, string, ReadonlySet<A>> =>
    C.make(setFromStringDecoder(separator)(codec, ord), setFromStringEncoder(separator)(ord)(codec))

export const SetFromString = {
  decoder: setFromStringDecoder,
  encoder: setFromStringEncoder,
  codec: setFromStringCodec,
}

/**
 * NonEmptyArrayFromString
 */

const nonEmptyArrayFromStringDecoder =
  (separator: string) =>
  <A>(decoder: Decoder<unknown, A>): Decoder<unknown, NonEmptyArray<A>> =>
    pipe(D.string, D.map(prepareArray(separator)), D.compose(NonEmptyArray.decoder(decoder)))

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

          if (List.isNonEmpty(diff)) {
            return D.failure(pjo, notParsed('StrictStruct', diff))
          }

          return D.success(res)
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).decode(pjo as any),
    ),
  )

function notParsed(name: string, diff: NonEmptyArray<string>): string {
  return pipe(diff, List.map(JSON.stringify), List.mkString(`${name}<{ notParsed: `, ' | ', ' }>'))
}

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

          if (List.isNonEmpty(diff)) {
            return D.failure(pjo, notParsed('StrictPartial', diff))
          }

          return D.success(res)
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

/**
 * SetFromArray
 */

const setFromArrayDecoder =
  <A>(eq: Eq<A>) =>
  (decoder: Decoder<unknown, A>): Decoder<unknown, ReadonlySet<A>> =>
    pipe(List.decoder(decoder), D.map(readonlySet.fromReadonlyArray(eq)))

const setFromArrayEncoder = <O, A>(encoder: Encoder<O, A>): Encoder<List<O>, ReadonlySet<A>> =>
  pipe(
    List.encoder(encoder),
    E.contramap(as => [...as]),
  )

const setFromArrayCodec =
  <A>(eq: Eq<A>) =>
  <O>(codec: Codec<unknown, O, A>): Codec<unknown, List<O>, ReadonlySet<A>> =>
    C.make(setFromArrayDecoder(eq)(codec), setFromArrayEncoder(codec))

export const SetFromArray = {
  decoder: setFromArrayDecoder,
  encoder: setFromArrayEncoder,
  codec: setFromArrayCodec,
}

/**
 * MapFromArray
 */

const mapFromArrayDecoder =
  <K>(eq: Eq<K>) =>
  <A>(
    keyDecoder: Decoder<unknown, K>,
    valueDecoder: Decoder<unknown, A>,
  ): Decoder<unknown, ReadonlyMap<K, A>> =>
    pipe(List.decoder(D.tuple(keyDecoder, valueDecoder)), D.map(MapUtils.fromReadonlyArray(eq)))

const mapFromArrayEncoder =
  <K>(ord: Ord<K>) =>
  <W, O, A>(
    keyEncoder: Encoder<W, K>,
    valueEncoder: Encoder<O, A>,
  ): Encoder<List<Tuple<W, O>>, ReadonlyMap<K, A>> =>
    pipe(
      List.encoder(E.readonly(E.tuple(keyEncoder, valueEncoder))),
      E.contramap((m: ReadonlyMap<K, A>) => readonlyMap.toReadonlyArray(ord)(m)),
    )

const mapFromArrayCodec =
  <K>(ord: Ord<K>) =>
  <W, O, A>(
    keyCodec: Codec<unknown, W, K>,
    valueCodec: Codec<unknown, O, A>,
  ): Codec<unknown, List<Tuple<W, O>>, ReadonlyMap<K, A>> =>
    C.make(
      mapFromArrayDecoder(ord)(keyCodec, valueCodec),
      mapFromArrayEncoder(ord)(keyCodec, valueCodec),
    )

export const MapFromArray = {
  decoder: mapFromArrayDecoder,
  encoder: mapFromArrayEncoder,
  codec: mapFromArrayCodec,
}
