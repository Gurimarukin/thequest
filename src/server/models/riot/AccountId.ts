import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type AccountId = Newtype<{ readonly AccountId: unique symbol }, string>

const { unwrap } = iso<AccountId>()

const codec = fromNewtype<AccountId>(C.string)

const AccountId = { unwrap, codec }

export { AccountId }
