import type { Applicative2 } from 'fp-ts/Applicative'
import type { Functor2 } from 'fp-ts/Functor'
import { type LazyArg, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { List, Maybe, immutableAssign } from '../utils/fp'

const URI = 'ValidatedSoft'

type URI = typeof URI

declare module 'fp-ts/HKT' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface URItoKind2<E, A> {
    readonly [URI]: ValidatedSoft<A, E>
  }
}

type ValidatedSoft<A, E> = {
  readonly value: A
  readonly errors: List<E>
}

function of<A, E = never>(value: A, ...errors: List<E>): ValidatedSoft<A, E> {
  return { value, errors }
}

const fromOption = <A, E>(
  onNone: LazyArg<readonly [value: A, ...errors: List<E>]>,
): ((fa: Maybe<A>) => ValidatedSoft<A, E>) => Maybe.fold(() => of(...onNone()), of)

const value = <A, E>(fa: ValidatedSoft<A, E>): A => fa.value

const errors = <A, E>(fa: ValidatedSoft<A, E>): List<E> => fa.errors

const map =
  <A, B>(f: (a: A) => B) =>
  <E>(fa: ValidatedSoft<A, E>): ValidatedSoft<B, E> => ({ value: f(fa.value), errors: fa.errors })

const mapLeft =
  <E, G>(f: (e: E) => G) =>
  <A>(fa: ValidatedSoft<A, E>): ValidatedSoft<A, G> => ({
    value: fa.value,
    errors: fa.errors.map(f),
  })

const bimap =
  <E, G, A, B>(g: (e: E) => G, f: (a: A) => B) =>
  (fa: ValidatedSoft<A, E>): ValidatedSoft<B, G> => ({
    value: f(fa.value),
    errors: fa.errors.map(g),
  })

function ap_<E, A, B>(
  fab: ValidatedSoft<(a: A) => B, E>,
  fa: ValidatedSoft<A, E>,
): ValidatedSoft<B, E> {
  return {
    value: fab.value(fa.value),
    errors: pipe(fab.errors, List.concat(fa.errors)),
  }
}

const chain =
  <E, A, B>(f: (a: A) => ValidatedSoft<B, E>) =>
  (fa: ValidatedSoft<A, E>): ValidatedSoft<B, E> => {
    const fb = f(fa.value)

    return { value: fb.value, errors: pipe(fa.errors, List.concat(fb.errors)) }
  }

const chainFirst = <E, A, B>(
  f: (a: A) => ValidatedSoft<B, E>,
): ((fa: ValidatedSoft<A, E>) => ValidatedSoft<A, E>) =>
  chain(a =>
    pipe(
      f(a),
      map(() => a),
    ),
  )

const map_: Functor2<URI>['map'] = (fa, f) => pipe(fa, map(f))

const Applicative: Applicative2<URI> = {
  URI,
  map: map_,
  ap: ap_,
  of,
}

function decoder<A, E>(
  valueDecoder: Decoder<unknown, A>,
  errorDecoder: Decoder<unknown, E>,
): Decoder<unknown, ValidatedSoft<A, E>> {
  return D.struct({
    value: valueDecoder,
    errors: D.array(errorDecoder),
  })
}

// don't declare encoder to enforce empty errors if no permission for user

const ValidatedSoft = immutableAssign(of, {
  fromOption,
  value,
  errors,
  map,
  mapLeft,
  bimap,
  chain,
  chainFirst,
  Applicative,
  decoder,
})

export { ValidatedSoft }
