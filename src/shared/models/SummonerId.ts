import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../utils/ioTsUtils'

type SummonerId = Newtype<{ readonly SummonerId: unique symbol }, string>

const { unwrap } = iso<SummonerId>()

const codec = fromNewtype<SummonerId>(C.string)

const SummonerId = { unwrap, codec }

export { SummonerId }
