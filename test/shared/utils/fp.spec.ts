import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { TeamId } from '../../../src/shared/models/api/activeGame/TeamId'
import { Future, List, PartialDict } from '../../../src/shared/utils/fp'

import { futureRunUnsafe } from '../../../src/client/utils/futureRunUnsafe'

import { expectT } from '../../expectT'

describe('List.differenceW', () => {
  it('should diff', () => {
    const byIdEq = eq.struct({
      id: number.Eq,
    })

    const as: List<{ id: number; foo: string }> = [
      { id: 1, foo: 'a' },
      { id: 2, foo: 'b' },
      { id: 3, foo: 'c' },
      { id: 4, foo: 'd' },
      { id: 5, foo: 'e' },
    ]

    const bs: List<{ id: number; bar: boolean }> = [
      { id: 5, bar: false },
      { id: 2, bar: true },
    ]

    expectT(pipe(as, List.differenceW(byIdEq)(bs))).toStrictEqual([
      { id: 1, foo: 'a' },
      { id: 3, foo: 'c' },
      { id: 4, foo: 'd' },
    ])
    expectT(List.differenceW(byIdEq)(as, bs)).toStrictEqual([
      { id: 1, foo: 'a' },
      { id: 3, foo: 'c' },
      { id: 4, foo: 'd' },
    ])
  })
})

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
