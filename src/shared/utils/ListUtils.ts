import type { nonEmptyArray } from 'fp-ts'
import { number, ord, readonlyMap } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'

import type { PartialDict } from './fp'
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

const multipleGroupBy =
  <A, K extends string>(f: (a: A) => NonEmptyArray<K>) =>
  (as: List<A>): PartialDict<K, NonEmptyArray<A>> => {
    const out: Partial<Record<K, nonEmptyArray.NonEmptyArray<A>>> = {}
    /* eslint-disable functional/no-loop-statements */
    for (const a of as) {
      const ks = f(a)
      for (const k of ks) {
        /* eslint-enable functional/no-loop-statements */
        if (has.call(out, k)) {
          /* eslint-disable functional/no-expression-statements */
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          out[k]!.push(a)
        } else {
          // eslint-disable-next-line functional/immutable-data
          out[k] = [a]
          /* eslint-enable functional/no-expression-statements */
        }
      }
    }
    return out
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

const listLengthOrd: Ord<List<unknown>> = pipe(number.Ord, ord.contramap(List.size))
const commonElems =
  <A>(eq: Eq<A>) =>
  (as: List<List<A>>): List<A> => {
    if (!List.isNonEmpty(as)) return []
    if (as.length === 1) return NonEmptyArray.head(as)

    const [shortest, remain] = pipe(as, NonEmptyArray.sort(listLengthOrd), NonEmptyArray.unprepend)
    if (!List.isNonEmpty(shortest)) return []

    return pipe(
      shortest,
      List.filter(a => pipe(remain, List.every(List.elem(eq)(a)))),
      List.uniq(eq),
    )
  }

/**
 * https://github.com/granteagon/move/blob/master/src/index.js
 *
 * Note: This is a pure function so a new array will be returned, instead of altering the array argument.
 *
 * @param as Array in which to move an item.
 * @param moveIndex The index of the item to move.
 * @param toIndex The index to move item at moveIndex to.
 * @returns
 */
const move = <A>(as: List<A>, moveIndex: number, toIndex: number): List<A> => {
  const item = as[moveIndex]
  const length = as.length
  const diff = moveIndex - toIndex

  if (diff > 0) {
    // move left
    return [
      ...as.slice(0, toIndex),
      item,
      ...as.slice(toIndex, moveIndex),
      ...as.slice(moveIndex + 1, length),
    ] as List<A>
  }
  if (diff < 0) {
    // move right
    const targetIndex = toIndex + 1
    return [
      ...as.slice(0, moveIndex),
      ...as.slice(moveIndex + 1, targetIndex),
      item,
      ...as.slice(targetIndex, length),
    ] as List<A>
  }
  return as
}

const swap = <A>(as: List<A>, swapIndex: number, toIndex: number): List<A> => {
  const res = as.slice()
  /* eslint-disable @typescript-eslint/no-non-null-assertion, functional/no-expression-statements, functional/immutable-data */
  res[swapIndex] = as[toIndex]!
  res[toIndex] = as[swapIndex]!
  /* eslint-enable functional/no-expression-statements, functional/immutable-data */
  return res
}

export const ListUtils = {
  findFirstBy,
  findFirstWithIndex,
  findFirstWithPrevious,
  groupByAsMap,
  mapWithPrevious,
  multipleGroupBy,
  updateOrAppend,
  padEnd,
  commonElems,
  move,
  swap,
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const has = Object.prototype.hasOwnProperty
