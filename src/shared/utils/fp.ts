import type { nonEmptyArray } from 'fp-ts'
import {
  either,
  io,
  ioEither,
  option,
  ord,
  readonlyArray,
  readonlyMap,
  readonlyNonEmptyArray,
  readonlyRecord,
  readonlyTuple,
  task,
  taskEither,
} from 'fp-ts'
import type { Applicative2 } from 'fp-ts/Applicative'
import type { Eq } from 'fp-ts/Eq'
import type { Kind2, URIS2 } from 'fp-ts/HKT'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import type { Refinement } from 'fp-ts/Refinement'
import type { LazyArg } from 'fp-ts/function'
import { flow, identity, pipe, tuple } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C_ from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E_ from 'io-ts/Encoder'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { MsDuration } from '../models/MsDuration'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function todo(...args: List<unknown>): never {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error('Missing implementation')
}

export function assertUnreachable(n: never): never {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`Unexpected value: ${n}`)
}

export const inspect =
  (...label: List<unknown>) =>
  <A>(a: A): A => {
    console.log(...label, a)
    return a
  }

export function immutableAssign<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  A extends (...args: List<any>) => unknown,
  B extends Dict<string, unknown>,
>(f: A, b: B): A & B {
  return Object.assign(f.bind({}) as A, b)
}

/**
 * Like ord.trivial, but with actual equals.
 */
export function idcOrd<A>({ equals }: Eq<A>): Ord<A> {
  return {
    equals,
    compare: (first: A, second: A) =>
      equals(first, second) ? 0 : ord.trivial.compare(first, second),
  }
}

export type NotUsed = Newtype<{ readonly NotUsed: unique symbol }, void>

export const NotUsed = iso<NotUsed>().wrap(undefined)

// a Future is an IO
export type NonIO<A> = A extends io.IO<unknown> ? never : A

type NonIONonNotUsed<A> = A extends NotUsed ? never : NonIO<A>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const toNotUsed = <A>(_: NonIONonNotUsed<A>): NotUsed => NotUsed

export type Dict<K extends string, A> = readonlyRecord.ReadonlyRecord<K, A>

export const Dict = {
  ...readonlyRecord,
  empty: <K extends string = string, A = never>(): Dict<K, A> => readonlyRecord.empty,
}

export type PartialDict<K extends string, A> = Partial<Dict<K, A>>

const partialDictMap = readonlyRecord.map as <A, B>(
  f: (a: A | undefined) => B | undefined,
) => <K extends string>(fa: PartialDict<K, A>) => PartialDict<K, B>

const partialDictMapWithIndex = readonlyRecord.mapWithIndex as <K extends string, A, B>(
  f: (k: K, a: A | undefined) => B | undefined,
) => (fa: PartialDict<K, A | undefined>) => PartialDict<K, B>

const partialDictTraverse = readonlyRecord.traverse as <F extends URIS2>(
  F: Applicative2<F>,
) => <E, A, B>(
  f: (a: A | undefined) => Kind2<F, E, B | undefined>,
) => <K extends string>(ta: PartialDict<K, A>) => Kind2<F, E, PartialDict<K, B>>

const partialDictTraverseWithIndex = readonlyRecord.traverseWithIndex as <F extends URIS2>(
  F: Applicative2<F>,
) => <K extends string, E, A, B>(
  f: (k: K, a: A | undefined) => Kind2<F, E, B | undefined>,
) => (ta: PartialDict<K, A>) => Kind2<F, E, PartialDict<K, B>>

export const PartialDict = {
  empty: <K extends string = string, A = never>(): PartialDict<K, A> => ({}),

  every: readonlyRecord.every as {
    <A, B extends A>(
      refinement: Refinement<A, B>,
    ): Refinement<PartialDict<string, A>, PartialDict<string, B>>
    <A>(predicate: Predicate<A>): Predicate<PartialDict<string, A>>
  },
  fromEntries: Object.fromEntries as <K extends string, A>(
    fa: List<Tuple<K, A>>,
  ) => PartialDict<K, A>,

  map: <A, B>(
    f: (a: A) => B | undefined,
  ): (<K extends string>(fa: PartialDict<K, A>) => PartialDict<K, B>) =>
    partialDictMap(a => (a !== undefined ? f(a) : undefined)),

  mapWithIndex: <K extends string, A, B>(
    f: (k: K, a: A) => B | undefined,
  ): ((fa: PartialDict<K, A>) => PartialDict<K, B>) =>
    partialDictMapWithIndex((k, a) => (a !== undefined ? f(k, a) : undefined)),

  traverse:
    <F extends URIS2>(F: Applicative2<F>) =>
    <E, A, B>(
      f: (a: A) => Kind2<F, E, B | undefined>,
    ): (<K extends string>(ta: PartialDict<K, A>) => Kind2<F, E, PartialDict<K, B>>) =>
      partialDictTraverse(F)(a => (a !== undefined ? f(a) : F.of<E, B | undefined>(undefined))),

  traverseWithIndex:
    <F extends URIS2>(F: Applicative2<F>) =>
    <K extends string, E, A, B>(
      f: (k: K, a: A) => Kind2<F, E, B | undefined>,
    ): ((ta: PartialDict<K, A>) => Kind2<F, E, PartialDict<K, B>>) =>
      partialDictTraverseWithIndex(F)((k, a) =>
        a !== undefined ? f(k, a) : F.of<E, B | undefined>(undefined),
      ),
}

export function emptyReadonlyMap<K, V>(): ReadonlyMap<K, V> {
  return readonlyMap.empty
}

export type Either<E, A> = either.Either<E, A>

export const Either = {
  ...either,
  exists: either.exists as <A>(predicate: Predicate<A>) => <E>(ma: either.Either<E, A>) => boolean,
}

export type Maybe<A> = option.Option<A>

const maybeDecoder = <I, A>(decoder: Decoder<I, A>): Decoder<I | null | undefined, Maybe<A>> => ({
  decode: u =>
    u === null || u === undefined
      ? D.success(option.none)
      : pipe(decoder.decode(u), either.map(option.some)),
})

const maybeEncoder = <O, A>(encoder: Encoder<O, A>): Encoder<O | null, Maybe<A>> => ({
  encode: flow(option.map(encoder.encode), option.toNullable),
})

export const Maybe = {
  ...option,
  every: <A>(predicate: Predicate<A>): ((fa: Maybe<A>) => boolean) =>
    option.fold(() => true, predicate),
  decoder: maybeDecoder,
  encoder: maybeEncoder,
  codec: <O, A>(codec: Codec<unknown, O, A>): Codec<unknown, O | null, Maybe<A>> =>
    C_.make(maybeDecoder(codec), maybeEncoder(codec)),
}

export type NonEmptyArray<A> = readonlyNonEmptyArray.ReadonlyNonEmptyArray<A>

const neaDecoder = <A>(decoder: Decoder<unknown, A>): Decoder<unknown, NonEmptyArray<A>> =>
  pipe(D.array(decoder), D.refine<List<A>, NonEmptyArray<A>>(List.isNonEmpty, 'NonEmptyArray'))

const neaEncoder = <O, A>(encoder: Encoder<O, A>): Encoder<NonEmptyArray<O>, NonEmptyArray<A>> => ({
  encode: NonEmptyArray.map(encoder.encode),
})

const {
  groupBy: {},
  ...neaMethods
} = readonlyNonEmptyArray

export const NonEmptyArray = {
  ...neaMethods,
  asMutable: identity as <A>(fa: NonEmptyArray<A>) => nonEmptyArray.NonEmptyArray<A>,
  decoder: neaDecoder,
  encoder: neaEncoder,
  codec: <O, A>(codec: Codec<unknown, O, A>): Codec<unknown, NonEmptyArray<O>, NonEmptyArray<A>> =>
    C_.make(neaDecoder(codec), neaEncoder(codec)),
}

export type List<A> = ReadonlyArray<A>

function mkString(sep: string): (list: List<string>) => string
function mkString(start: string, sep: string, end: string): (list: List<string>) => string
function mkString(startOrSep: string, sep?: string, end?: string): (list: List<string>) => string {
  return list =>
    sep !== undefined && end !== undefined
      ? `${startOrSep}${list.join(sep)}${end}`
      : list.join(startOrSep)
}

const listDecoder: <A>(decoder: Decoder<unknown, A>) => Decoder<unknown, List<A>> = D.array

const listEncoder: <O, A>(encoder: Encoder<O, A>) => Encoder<List<O>, List<A>> = flow(
  E_.array,
  E_.readonly,
)

export const List = {
  ...readonlyArray,
  empty: <A = never>(): List<A> => readonlyArray.empty,
  differenceW: readonlyArray.difference as <C>(E: Eq<C>) => {
    <A extends C, B extends C>(xs: List<B>): (ys: List<A>) => List<A>
    <A extends C, B extends C>(xs: List<A>, ys: List<B>): List<A>
  },
  groupBy: readonlyNonEmptyArray.groupBy as <A, K extends string>(
    f: (a: A) => K,
  ) => (as: List<A>) => PartialDict<K, NonEmptyArray<A>>,
  groupByStr: readonlyNonEmptyArray.groupBy,
  asMutable: identity as <A>(fa: List<A>) => A[],
  mkString,
  decoder: listDecoder,
  encoder: listEncoder,
  codec: <O, A>(codec: Codec<unknown, O, A>): Codec<unknown, List<O>, List<A>> =>
    C_.make(listDecoder(codec), listEncoder(codec)),
}

export type Tuple<A, B> = readonly [A, B]

export const Tuple = {
  ...readonlyTuple,
  of: tuple,
}

export type Tuple3<A, B, C> = readonly [A, B, C]

export type Try<A> = Either<Error, A>

const {
  right: {},
  left: {},
  ...tryMethods
} = either

export const Try = {
  ...tryMethods,
  success: either.right as <A>(a: A) => Try<A>,
  failure: either.left as <A = never>(e: Error) => Try<A>,
  fromNullable: either.fromNullable as (e: Error) => <A>(a: A) => Try<NonNullable<A>>,
  tryCatch: <A>(a: LazyArg<A>): Try<A> => Either.tryCatch(a, Either.toError),
  getUnsafe: <A>(t: Try<A>): A =>
    pipe(
      t,
      Either.getOrElse<Error, A>(e => {
        // eslint-disable-next-line functional/no-throw-statements
        throw e
      }),
    ),
}

export type Future<A> = task.Task<Try<A>>

const futureNotUsed: Future<NotUsed> = taskEither.right(NotUsed)

const {
  right: {},
  left: {},
  ...futureMethods
} = taskEither
export const Future = {
  ...futureMethods,
  successful: taskEither.right as <A>(a: A) => Future<A>,
  failed: taskEither.left as <A = never>(e: Error) => Future<A>,
  chainFirstIOEitherK: <A, B>(f: (a: A) => IO<B>): ((fa: Future<A>) => Future<A>) =>
    taskEither.chainFirst(flow(f, taskEither.fromIOEither)),
  orElseEitherK: <A>(f: (e: Error) => Try<A>): ((fa: Future<A>) => Future<A>) =>
    taskEither.orElse(flow(f, Future.fromEither)),
  orElseIOEitherK: <A>(f: (e: Error) => IO<A>): ((fa: Future<A>) => Future<A>) =>
    taskEither.orElse(flow(f, Future.fromIOEither)),
  fromIO: taskEither.fromIO as <A>(fa: io.IO<A>) => Future<A>,
  tryCatch: <A>(f: LazyArg<Promise<A>>): Future<A> => taskEither.tryCatch(f, Either.toError),
  notUsed: futureNotUsed,
  todo: (...args: List<unknown>): Future<never> =>
    taskEither.fromEither(Try.tryCatch(() => todo(args))),
  run:
    (onError: (e: Error) => io.IO<NotUsed>) =>
    (f: Future<NotUsed>): Promise<NotUsed> =>
      pipe(f, task.chain(either.fold(flow(onError, task.fromIO), task.of)))(),
  runUnsafe: <A>(fa: Future<A>): Promise<A> => pipe(fa, task.map(Try.getUnsafe))(),
  delay:
    <A>(ms: MsDuration) =>
    (future: Future<A>): Future<A> =>
      pipe(future, task.delay(MsDuration.unwrap(ms))),
}

export type IO<A> = io.IO<Try<A>>

const ioNotUsed: IO<NotUsed> = ioEither.right(NotUsed)

const ioFromIO: <A>(fa: io.IO<A>) => IO<A> = ioEither.fromIO

const ioRun =
  (onError: (e: Error) => io.IO<NotUsed>) =>
  (ioA: IO<NotUsed>): NotUsed =>
    pipe(ioA, io.chain(either.fold(onError, io.of)))()

const {
  right: {},
  left: {},
  ...ioMethods
} = ioEither

export const IO = {
  ...ioMethods,
  successful: ioEither.right as <A>(a: A) => IO<A>,
  failed: ioEither.left as <A = never>(e: Error) => IO<A>,
  tryCatch: <A>(a: LazyArg<A>): IO<A> => ioEither.tryCatch(a, Either.toError),
  fromIO: ioFromIO,
  notUsed: ioNotUsed,
  runFuture:
    (onError: (e: Error) => io.IO<NotUsed>) =>
    (f: Future<NotUsed>): io.IO<NotUsed> =>
    () => {
      // eslint-disable-next-line functional/no-expression-statements
      void pipe(f, Future.run(onError))

      return NotUsed
    },
  run: ioRun,
  runUnsafe: <A>(ioA: IO<A>): A => Try.getUnsafe(ioA()),
  setTimeout:
    (onError: (e: Error) => io.IO<NotUsed>) =>
    (delay: MsDuration) =>
    (io_: IO<NotUsed>): IO<NodeJS.Timeout> =>
      IO.tryCatch(() => setTimeout(() => pipe(io_, ioRun(onError)), MsDuration.unwrap(delay))),
}

export const refinementFromPredicate = identity as <A>(pred: Predicate<A>) => Refinement<A, A>
