import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type AccessToken = Newtype<{ readonly AccessToken: unique symbol }, string>

const codec = fromNewtype<AccessToken>(C.string)

const AccessToken = { codec }

export { AccessToken }
