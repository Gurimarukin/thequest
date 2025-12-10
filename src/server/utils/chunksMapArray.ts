import type { Tuple } from '../../shared/utils/fp'
import { List, Maybe } from '../../shared/utils/fp'

/**
 * Chunks the as where `f(a)` is true.
 */
export const chunksMapArray =
  <A>(f: (a: A) => boolean) =>
  (as: List<A>): Maybe<List<Tuple<A, List<A>>>> => {
    if (!List.isNonEmpty(as)) return Maybe.some([])

    const [head, ...tail] = as

    if (!f(head)) return Maybe.none

    /* eslint-disable functional/no-let */
    let fst: A = head
    let acc: A[] = []
    /* eslint-enable functional/no-let */
    const res: Tuple<A, List<A>>[] = []

    /* eslint-disable functional/no-expression-statements, functional/immutable-data*/
    tail.forEach(a => {
      if (f(a)) {
        res.push([fst, acc])
        fst = a
        acc = []
      } else {
        acc.push(a)
      }
    })

    res.push([fst, acc])
    /* eslint-enable functional/no-expression-statements, functional/immutable-data */
    return Maybe.some(res)
  }
