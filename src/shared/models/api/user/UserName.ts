import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

type UserName = Newtype<{ readonly UserName: unique symbol }, string>

const { wrap, unwrap } = iso<UserName>()

const codec = fromNewtype<UserName>(C.string)

const UserName = { wrap, unwrap, codec }

export { UserName }
