import { flow } from 'fp-ts/function'

import { Future } from '../../shared/utils/fp'

export const futureRunUnsafe: <A>(fa: Future<A>) => Promise<A> = flow(
  Future.orElse(e => {
    console.error(e)
    return Future.failed(e)
  }),
  Future.runUnsafe,
)
