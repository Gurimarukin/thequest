import { pipe } from 'fp-ts/function'

import { Maybe } from '../../../src/shared/utils/fp'

import { chunksMapArray } from '../../../src/server/utils/chunksMapArray'

import { expectT } from '../../expectT'

describe('chunksMapArray', () => {
  it('should split map empty array', () => {
    const actual = pipe(
      [],
      chunksMapArray(() => false),
    )

    expectT(actual).toStrictEqual(Maybe.some([]))
  })

  it('should split map base case', () => {
    const actual = pipe(
      [1, 'a', 'b', 2, 'c', 'd'],
      chunksMapArray(e => typeof e === 'number'),
    )

    expectT(actual).toStrictEqual(
      Maybe.some([
        [1, ['a', 'b']],
        [2, ['c', 'd']],
      ]),
    )
  })

  it('should fail for none for first case', () => {
    const actual = pipe(
      ['a', 'b', 2, 'c', 'd'],
      chunksMapArray(e => typeof e === 'number'),
    )

    expectT(actual).toStrictEqual(Maybe.none)
  })

  it('should handle more complex case', () => {
    const actual = pipe(
      [1, 2, 'a', 'b', 3, 'c', 'd', 4],
      chunksMapArray(e => typeof e === 'number'),
    )

    expectT(actual).toStrictEqual(
      Maybe.some([
        [1, []],
        [2, ['a', 'b']],
        [3, ['c', 'd']],
        [4, []],
      ]),
    )
  })
})
