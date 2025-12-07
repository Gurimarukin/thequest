import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

type ItemId = Newtype<{ readonly ItemId: unique symbol }, number>

const { wrap, unwrap } = iso<ItemId>()

const codec = fromNewtype<ItemId>(C.number)

const Eq: eq.Eq<ItemId> = pipe(number.Eq, eq.contramap(unwrap))

const ItemId = immutableAssign(wrap, { unwrap, codec, Eq })

export { ItemId }
