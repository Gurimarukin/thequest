import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type ClientSecret = Newtype<{ readonly ClientSecret: unique symbol }, string>

const { unwrap } = iso<ClientSecret>()

const codec = fromNewtype<ClientSecret>(C.string)

const ClientSecret = { unwrap, codec }

export { ClientSecret }
