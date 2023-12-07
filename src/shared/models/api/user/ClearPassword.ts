import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../utils/fp'
import { NonEmptyString, fromNewtype } from '../../../utils/ioTsUtils'

type ClearPassword = Newtype<{ readonly ClearPassword: unique symbol }, string>

const { wrap, unwrap } = iso<ClearPassword>()

const codec = fromNewtype<ClearPassword>(NonEmptyString.codec)

const ClearPassword = immutableAssign(wrap, { unwrap, codec })

export { ClearPassword }
