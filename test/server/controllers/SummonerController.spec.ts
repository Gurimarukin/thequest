import { Maybe, Try } from '../../../src/shared/utils/fp'

import { shouldNotifyChampionLeveledUp } from '../../../src/server/controllers/SummonerController'

import { expectT } from '../../expectT'

describe('shouldNotifyChampionLeveledUp', () => {
  it('should notify champion leveled up', () => {
    expectT(shouldNotifyChampionLeveledUp(9)(0)(0)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(1)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(2)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(3)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(4)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(5)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(6)).toStrictEqual(Try.success(Maybe.some(1)))
    expectT(shouldNotifyChampionLeveledUp(9)(0)(7)).toStrictEqual(Try.success(Maybe.some(2)))

    expectT(shouldNotifyChampionLeveledUp(1)(0)(6)).toStrictEqual(Try.success(Maybe.some(1)))
    expectT(shouldNotifyChampionLeveledUp(1)(0)(7)).toStrictEqual(Try.success(Maybe.some(1)))

    expectT(shouldNotifyChampionLeveledUp(0)(0)(6)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(0)(0)(7)).toStrictEqual(Try.success(Maybe.none))

    //

    expectT(shouldNotifyChampionLeveledUp(9)(2)(2)).toStrictEqual(Try.success(Maybe.none))

    //

    expectT(shouldNotifyChampionLeveledUp(9)(4)(4)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(4)(5)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(4)(6)).toStrictEqual(Try.success(Maybe.some(1)))
    expectT(shouldNotifyChampionLeveledUp(9)(4)(7)).toStrictEqual(Try.success(Maybe.some(2)))

    expectT(shouldNotifyChampionLeveledUp(1)(4)(6)).toStrictEqual(Try.success(Maybe.some(1)))
    expectT(shouldNotifyChampionLeveledUp(1)(4)(7)).toStrictEqual(Try.success(Maybe.some(1)))

    expectT(shouldNotifyChampionLeveledUp(0)(4)(6)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(0)(4)(7)).toStrictEqual(Try.success(Maybe.none))

    //

    expectT(shouldNotifyChampionLeveledUp(9)(5)(5)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(5)(6)).toStrictEqual(Try.success(Maybe.some(1)))
    expectT(shouldNotifyChampionLeveledUp(9)(5)(7)).toStrictEqual(Try.success(Maybe.some(2)))

    expectT(shouldNotifyChampionLeveledUp(1)(5)(6)).toStrictEqual(Try.success(Maybe.some(1)))
    expectT(shouldNotifyChampionLeveledUp(1)(5)(7)).toStrictEqual(Try.success(Maybe.some(1)))

    expectT(shouldNotifyChampionLeveledUp(0)(5)(6)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(0)(5)(7)).toStrictEqual(Try.success(Maybe.none))

    //

    expectT(shouldNotifyChampionLeveledUp(9)(6)(6)).toStrictEqual(Try.success(Maybe.none))
    expectT(shouldNotifyChampionLeveledUp(9)(6)(7)).toStrictEqual(Try.success(Maybe.some(1)))

    expectT(shouldNotifyChampionLeveledUp(1)(6)(7)).toStrictEqual(Try.success(Maybe.some(1)))

    expectT(shouldNotifyChampionLeveledUp(0)(6)(7)).toStrictEqual(Try.success(Maybe.none))
  })
})
