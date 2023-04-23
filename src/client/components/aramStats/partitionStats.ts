import { predicate, separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { identity, pipe } from 'fp-ts/function'

import { Either, List, NonEmptyArray } from '../../../shared/utils/fp'

export const partitionStats = <A>(as: List<Either<A, A>>): Separated<List<A>, List<A>> => {
  if (List.isEmpty(as)) return separated.separated([], [])

  if (as.length === 1) {
    return separated.separated(pipe(as, List.map(Either.getOrElse(identity))), [])
  }

  const { left: lefts, right: rights } = List.separate(as)

  return pipe(
    rights.length === 1
      ? separated.separated([], rights)
      : pipe(rights, List.partitionWithIndex(isOdd)),
    concatSeparated(
      isOdd(rights.length)
        ? pipe(
            lefts,
            List.match(
              () => separated.separated([], []),
              NonEmptyArray.matchLeft((head, tail) =>
                // separated.bimap
                pipe(
                  separated.separated([head], []),
                  concatSeparated(pipe(tail, List.partitionWithIndex(isOdd))),
                ),
              ),
            ),
          )
        : pipe(lefts, List.partitionWithIndex(isOdd)),
    ),
  )
}

const isEven = (n: number): boolean => n % 2 === 0
const isOdd = predicate.not(isEven)

const concatSeparated =
  <E, A>(second: Separated<List<E>, List<A>>) =>
  (first: Separated<List<E>, List<A>>): Separated<List<E>, List<A>> =>
    pipe(first, separated.bimap(List.concat(second.left), List.concat(second.right)))
