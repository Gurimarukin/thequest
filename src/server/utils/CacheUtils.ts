import { io } from 'fp-ts'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'

import { Store } from '../../shared/models/Store'
import type { List } from '../../shared/utils/fp'
import { Future, Maybe, NonEmptyArray, PartialDict, Tuple } from '../../shared/utils/fp'

const fetchCached = <K extends string, A, Args extends List<unknown>>(
  cacheFor: NonEmptyArray<K>,
  fetch: (key: K) => (...args: Args) => Future<A>,
  filterCache: (key: K) => (...args: Args) => io.IO<Predicate<A>>,
): ((key: K) => (...args: Args) => Future<A>) => {
  const caches: PartialDict<K, Store<Maybe<A>>> = pipe(
    cacheFor,
    NonEmptyArray.map(key => Tuple.of(key, Store(Maybe.none))),
    PartialDict.fromEntries,
  )

  return key =>
    (...args) => {
      const cache = caches[key]

      if (cache === undefined) return fetch(key)(...args)

      return pipe(
        cache.get,
        io.chain(
          Maybe.fold(
            () => io.of(Maybe.none),
            data =>
              pipe(
                filterCache(key)(...args),
                io.map(keep => (keep(data) ? Maybe.some(data) : Maybe.none)),
              ),
          ),
        ),
        Future.fromIO,
        Future.chain(
          Maybe.fold(
            () => pipe(fetch(key)(...args), Future.chainFirstIOK(flow(Maybe.some, cache.set))),
            Future.successful,
          ),
        ),
      )
    }
}

export const CacheUtils = { fetchCached }
