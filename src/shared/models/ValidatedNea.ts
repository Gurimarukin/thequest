import { apply } from 'fp-ts'
import type { Applicative2C } from 'fp-ts/Applicative'
import type { LazyArg } from 'fp-ts/function'
import { flow } from 'fp-ts/function'

import type { Dict, List } from '../utils/fp'
import { Either, Maybe, NonEmptyArray } from '../utils/fp'

type ValidatedNea<E, A> = Either<NonEmptyArray<E>, A>

const valid: <E = never, A = never>(a: A) => ValidatedNea<E, A> = Either.right

const invalid: <E = never, A = never>(e: NonEmptyArray<E>) => ValidatedNea<E, A> = Either.left

const fromEither: <E, A>(either: Either<E, A>) => ValidatedNea<E, A> = Either.mapLeft(
  NonEmptyArray.of,
)

const fromOption = <E, A>(onNone: LazyArg<E>): ((ma: Maybe<A>) => ValidatedNea<E, A>) =>
  flow(Either.fromOption(onNone), fromEither)

const fromEmptyE = <E, A>(e: E): ((either: Either<List<E>, A>) => ValidatedNea<E, A>) =>
  Either.mapLeft(
    flow(
      NonEmptyArray.fromReadonlyArray,
      Maybe.getOrElse(() => NonEmptyArray.of(e)),
    ),
  )

const fromEmptyErrors: <A>(either: Either<List<string>, A>) => ValidatedNea<string, A> = fromEmptyE(
  'Got empty Errors from codec',
)

const chainOptionK =
  <E>(onNone: LazyArg<E>) =>
  <A, B>(f: (a: A) => Maybe<B>): ((ma: ValidatedNea<E, A>) => ValidatedNea<E, B>) =>
    Either.chain(flow(f, fromOption(onNone)))

const chainEitherK = <E, A, B>(
  f: (a: A) => Either<E, B>,
): ((fa: ValidatedNea<E, A>) => ValidatedNea<E, B>) => Either.chain(flow(f, fromEither))

const bimap = <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
): ((fa: ValidatedNea<E, A>) => ValidatedNea<G, B>) => Either.bimap(NonEmptyArray.map(f), g)

const getValidation = <E = never>(): Applicative2C<'Either', NonEmptyArray<E>> =>
  Either.getApplicativeValidation(NonEmptyArray.getSemigroup<E>())

type ToValidatedDict<E, A extends Dict<string, unknown>> = {
  [K in keyof A]: ValidatedNea<E, A[K]>
}

type SeqS<E> = <A extends Dict<string, unknown>>(a: ToValidatedDict<E, A>) => ValidatedNea<E, A>

const getSeqS = <E = never>(): SeqS<E> => apply.sequenceS(getValidation<E>()) as SeqS<E>

const {
  left: {},
  right: {},
  ...validatedNea
} = Either
const ValidatedNea = {
  ...validatedNea,
  valid,
  invalid,
  fromEither,
  fromOption,
  fromNullable: Either.fromNullable as <E>(
    e: NonEmptyArray<E>,
  ) => <A>(a: A) => ValidatedNea<E, NonNullable<A>>,
  fromEmptyE,
  fromEmptyErrors,
  map: Either.map as <A, B>(f: (a: A) => B) => <E>(fa: ValidatedNea<E, A>) => ValidatedNea<E, B>,
  chain: Either.chain as <E, A, B>(
    f: (a: A) => ValidatedNea<E, B>,
  ) => (ma: ValidatedNea<E, A>) => ValidatedNea<E, B>,
  chainOptionK,
  chainNullableK: Either.chainNullableK as <E>(
    e: NonEmptyArray<E>,
  ) => <A, B>(
    f: (a: A) => B | null | undefined,
  ) => (ma: ValidatedNea<E, A>) => ValidatedNea<E, NonNullable<B>>,
  chainEitherK,
  bimap,
  bind: Either.bind as <N extends string, A, E, B>(
    name: Exclude<N, keyof A>,
    f: (a: A) => ValidatedNea<E, B>,
  ) => (
    ma: ValidatedNea<E, A>,
  ) => ValidatedNea<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>,
  getValidation,
  getSeqS,
}

export { ValidatedNea }
