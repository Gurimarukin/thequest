import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type OAuth2Code = Newtype<{ readonly OAuth2Code: unique symbol }, string>

const { unwrap } = iso<OAuth2Code>()

const codec = fromNewtype<OAuth2Code>(C.string)

const OAuth2Code = { unwrap, codec }

export { OAuth2Code }
