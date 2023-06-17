import { readonlyMap, semigroup } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'

import type { Tuple } from './fp'
import { List } from './fp'

const fromReadonlyArray =
  <K>(eq: Eq<K>) =>
  <A>(fa: List<Tuple<K, A>>): ReadonlyMap<K, A> =>
    readonlyMap.fromFoldable(eq, semigroup.last<A>(), List.Foldable)(fa)

export const MapUtils = { fromReadonlyArray }
