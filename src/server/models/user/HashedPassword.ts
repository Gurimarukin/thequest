import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../shared/utils/fp'
import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type HashedPassword = Newtype<{ readonly HashedPassword: unique symbol }, string>

const { wrap, unwrap } = iso<HashedPassword>()

const codec = fromNewtype<HashedPassword>(C.string)

const HashedPassword = immutableAssign(wrap, { unwrap, codec })

export { HashedPassword }
