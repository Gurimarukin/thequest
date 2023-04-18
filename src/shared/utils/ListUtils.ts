import type { Eq } from 'fp-ts/Eq'
import type { Predicate } from 'fp-ts/Predicate'
import { pipe } from 'fp-ts/function'

import { List, Maybe, Tuple } from './fp'

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

const findFirstWithIndex =
  <A>(predicate: Predicate<A>) =>
  (as: List<A>): Maybe<Tuple<number, A>> =>
    pipe(
      as,
      List.findIndex(predicate),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Maybe.map(i => Tuple.of(i, as[i]!)),
    )

export const ListUtils = { updateOrAppend, findFirstWithIndex }
