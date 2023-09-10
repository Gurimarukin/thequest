import { number } from 'fp-ts'

import { ListUtils } from '../../../src/shared/utils/ListUtils'

import { expectT } from '../../expectT'

const commonElemsN = ListUtils.commonElems(number.Eq)

describe('ListUtils.commonElems', () => {
  it('should empty', () => {
    expectT(commonElemsN([])).toStrictEqual([])
  })

  it('should one element', () => {
    expectT(commonElemsN([[1, 2]])).toStrictEqual([1, 2])
  })

  it('should multiple []', () => {
    expectT(commonElemsN([[1, 2], []])).toStrictEqual([])
  })

  it('should multiple [1]', () => {
    expectT(
      commonElemsN([
        [1, 2, 4, 7],
        [1, 1, 6],
        [1, 3, 5, 8],
      ]),
    ).toStrictEqual([1])
  })

  it('should multiple [1, 2]', () => {
    expectT(
      commonElemsN([
        [1, 2, 3],
        [4, 5, 2, 1],
        [6, 1, 7, 2],
      ]),
    ).toStrictEqual([1, 2])
  })
})
