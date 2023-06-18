import { readonlyMap } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'

import { List, Maybe, NonEmptyArray, Tuple } from './fp'

const findFirstBy =
  <B>(eq: Eq<B>) =>
  <A>(f: (a: A) => B) =>
  (as: List<A>) =>
  (value: B): Maybe<A> =>
    pipe(
      as,
      List.findFirst(v => eq.equals(f(v), value)),
    )

const findFirstWithIndex =
  <A>(predicate: Predicate<A>) =>
  (as: List<A>): Maybe<Tuple<number, A>> =>
    pipe(
      as,
      List.findIndex(predicate),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Maybe.map(i => Tuple.of(i, as[i]!)),
    )

const findFirstWithPrevious =
  <A>(f: (prev: Maybe<A>, a: A) => boolean) =>
  (as: List<A>): Maybe<A> => {
    // eslint-disable-next-line functional/no-let
    let prev: Maybe<A> = Maybe.none
    return pipe(
      as,
      List.findFirst(a => {
        const res = f(prev, a)
        // eslint-disable-next-line functional/no-expression-statements
        prev = Maybe.some(a)
        return res
      }),
    )
  }

const groupByAsMap =
  <K>(eq: Eq<K>) =>
  <A, B>(f: (a: A) => Tuple<K, B>) =>
  (as: List<A>): ReadonlyMap<K, NonEmptyArray<B>> =>
    pipe(
      as,
      List.map(flow(f, Tuple.mapSnd(NonEmptyArray.of))),
      readonlyMap.fromFoldable(eq, NonEmptyArray.getSemigroup<B>(), List.Foldable),
    )

const mapWithPrevious =
  <A, B>(f: (prev: Maybe<A>, a: A) => B) =>
  (as: List<A>): List<B> => {
    // eslint-disable-next-line functional/no-let
    let prev: Maybe<A> = Maybe.none
    return pipe(
      as,
      List.map(a => {
        const res = f(prev, a)
        // eslint-disable-next-line functional/no-expression-statements
        prev = Maybe.some(a)
        return res
      }),
    )
  }

const updateOrAppend =
  <A>(eq: Eq<A>) =>
  (a: A) =>
  (as: List<A>): List<A> =>
    pipe(
      as,
      List.findIndex(a_ => eq.equals(a_, a)),
      Maybe.fold(
        () => pipe(as, List.append(a)),
        i => List.unsafeUpdateAt(i, a, as),
      ),
    )

const padEnd =
  <B>(maxLength: number, fillWith: B) =>
  <A>(as: List<A>): List<A | B> =>
    maxLength <= as.length
      ? as
      : pipe(as, List.concatW(List.makeBy(maxLength - as.length, () => fillWith)))

export const ListUtils = {
  findFirstBy,
  findFirstWithIndex,
  findFirstWithPrevious,
  groupByAsMap,
  mapWithPrevious,
  updateOrAppend,
  padEnd,
}
