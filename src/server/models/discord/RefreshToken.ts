import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type RefreshToken = Newtype<{ readonly RefreshToken: unique symbol }, string>

const { unwrap } = iso<RefreshToken>()

const codec = fromNewtype<RefreshToken>(C.string)

const RefreshToken = { unwrap, codec }

export { RefreshToken }
