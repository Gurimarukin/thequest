import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { List } from './fp'

const updateOrAppend =
  <A>(eq: Eq<A>) =>
  (a: A) =>
  (as: List<A>): List<A> =>
    updateOrAppendRec(as, eq, a, [])

function updateOrAppendRec<A>(as: List<A>, eq: Eq<A>, a: A, acc: List<A>): List<A> {
  const [head, ...tail] = as
  if (head === undefined) return pipe(acc, List.append(a))

  if (eq.equals(head, a)) return pipe(acc, List.append(a), List.concat(tail))

  return updateOrAppendRec(tail, eq, a, pipe(acc, List.append<A>(head)))
}

export const ListUtils = { updateOrAppend }
