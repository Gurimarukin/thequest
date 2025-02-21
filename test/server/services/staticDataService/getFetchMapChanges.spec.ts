import { pipe } from 'fp-ts/function'

import { Either, Maybe } from '../../../../src/shared/utils/fp'

import { splitMapArray } from '../../../../src/server/services/staticDataService/getFetchMapChanges'

import { expectT } from '../../../expectT'

describe('getFetchMapChanges', () => {
  describe('splitMapArray', () => {
    it('should split map empty array', () => {
      const actual = pipe(
        [],
        splitMapArray(() => Maybe.none),
      )

      expectT(actual).toStrictEqual(Maybe.some([]))
    })

    it('should split map base case', () => {
      const actual = pipe(
        [
          Either.left(1),
          Either.right('a'),
          Either.right('b'),
          Either.left(2),
          Either.right('c'),
          Either.right('d'),
        ],
        splitMapArray(e => (Either.isLeft(e) ? Maybe.some(e.left) : Maybe.none)),
      )

      expectT(actual).toStrictEqual(
        Maybe.some([
          [1, [Either.right('a'), Either.right('b')]],
          [2, [Either.right('c'), Either.right('d')]],
        ]),
      )
    })

    it('should fail for none for first case', () => {
      const actual = pipe(
        [
          Either.right('a'),
          Either.right('b'),
          Either.left(2),
          Either.right('c'),
          Either.right('d'),
        ],
        splitMapArray(e => (Either.isLeft(e) ? Maybe.some(e.left) : Maybe.none)),
      )

      expectT(actual).toStrictEqual(Maybe.none)
    })

    it('should handle more complex case', () => {
      const actual = pipe(
        [
          Either.left(1),
          Either.left(2),
          Either.right('a'),
          Either.right('b'),
          Either.left(3),
          Either.right('c'),
          Either.right('d'),
          Either.left(4),
        ],
        splitMapArray(e => (Either.isLeft(e) ? Maybe.some(e.left) : Maybe.none)),
      )

      expectT(actual).toStrictEqual(
        Maybe.some([
          [1, []],
          [2, [Either.right('a'), Either.right('b')]],
          [3, [Either.right('c'), Either.right('d')]],
          [4, []],
        ]),
      )
    })
  })
})
