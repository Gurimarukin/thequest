import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type DDragonVersion = Newtype<{ readonly DDragonVersion: unique symbol }, string>

const { unwrap } = iso<DDragonVersion>()

const codec = fromNewtype<DDragonVersion>(C.string)

const DDragonVersion = { unwrap, codec }

export { DDragonVersion }
