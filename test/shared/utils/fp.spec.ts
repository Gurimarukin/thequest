import { pipe } from 'fp-ts/function'

import type { TeamId } from '../../../src/shared/models/api/activeGame/TeamId'
import { Future, PartialDict } from '../../../src/shared/utils/fp'

import { futureRunUnsafe } from '../../../src/client/utils/futureRunUnsafe'

describe('PartialDict.traverse', () => {
  it('should traverse', () => {
    const partialDict: PartialDict<`${TeamId}`, number> = {
      100: 12,
    }

    return pipe(
      partialDict,
      PartialDict.traverse(Future.ApplicativePar)(Future.successful),
      futureRunUnsafe,
    )
  })
})
