import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../shared/utils/fp'
import { fromNewtype } from '../../../shared/utils/ioTsUtils'

// encrypted summoner id

type SummonerId = Newtype<{ readonly SummonerId: unique symbol }, string>

const { wrap, unwrap } = iso<SummonerId>()

const codec = fromNewtype<SummonerId>(C.string)

const SummonerId = immutableAssign(wrap, { unwrap, codec })

export { SummonerId }
