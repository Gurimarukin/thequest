import { separated } from 'fp-ts'

import { Either } from '../../../../src/shared/utils/fp'

import { partitionStats } from '../../../../src/client/components/mapChanges/stats/partitionStats'

import { expectT } from '../../../expectT'

describe('partitionStats', () => {
  it('[]', () => {
    expectT(partitionStats([])).toStrictEqual(separated.separated([], []))
  })

  it('[a]', () => {
    expectT(partitionStats([Either.right('a')])).toStrictEqual(separated.separated(['a'], []))
  })

  it('[A]', () => {
    expectT(partitionStats([Either.left('A')])).toStrictEqual(separated.separated(['A'], []))
  })

  /**
   * a b
   * c d
   */
  it('[a,b,c,d]', () => {
    expectT(
      partitionStats([Either.right('a'), Either.right('b'), Either.right('c'), Either.right('d')]),
    ).toStrictEqual(separated.separated(['a', 'c'], ['b', 'd']))
  })

  /**
   * A B
   * C D
   */
  it('[A,B,C,D]', () => {
    expectT(
      partitionStats([Either.left('A'), Either.left('B'), Either.left('C'), Either.left('D')]),
    ).toStrictEqual(separated.separated(['A', 'C'], ['B', 'D']))
  })

  /**
   * a b
   * c d
   * e
   */
  it('[a,b,c,d,e]', () => {
    expectT(
      partitionStats([
        Either.right('a'),
        Either.right('b'),
        Either.right('c'),
        Either.right('d'),
        Either.right('e'),
      ]),
    ).toStrictEqual(separated.separated(['a', 'c', 'e'], ['b', 'd']))
  })

  /**
   * A B
   * C D
   * E
   */
  it('[A,B,C,D,E]', () => {
    expectT(
      partitionStats([
        Either.left('A'),
        Either.left('B'),
        Either.left('C'),
        Either.left('D'),
        Either.left('E'),
      ]),
    ).toStrictEqual(separated.separated(['A', 'C', 'E'], ['B', 'D']))
  })

  /**
   * B a
   */
  it('[a,B]', () => {
    expectT(partitionStats([Either.right('a'), Either.left('B')])).toStrictEqual(
      separated.separated(['B'], ['a']),
    )
  })

  /**
   * B a
   * C
   */
  it('[a,B,C]', () => {
    expectT(partitionStats([Either.right('a'), Either.left('B'), Either.left('C')])).toStrictEqual(
      separated.separated(['B', 'C'], ['a']),
    )
  })

  /**
   * a b
   * C D
   */
  it('[a,b,C,D]', () => {
    expectT(
      partitionStats([Either.right('a'), Either.right('b'), Either.left('C'), Either.left('D')]),
    ).toStrictEqual(separated.separated(['a', 'C'], ['b', 'D']))
  })
})
