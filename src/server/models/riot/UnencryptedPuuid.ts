import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type UnencryptedPuuid = Newtype<{ readonly UnencryptedPuuid: unique symbol }, string>

const { unwrap } = iso<UnencryptedPuuid>()

const codec = fromNewtype<UnencryptedPuuid>(C.string)

const UnencryptedPuuid = { unwrap, codec }

export { UnencryptedPuuid }
