import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../utils/fp'
import { NonEmptyString, fromNewtype } from '../../../utils/ioTsUtils'

type UserName = Newtype<{ readonly UserName: unique symbol }, string>

const { wrap, unwrap } = iso<UserName>()

const codec = fromNewtype<UserName>(NonEmptyString.codec)

const UserName = immutableAssign(wrap, { unwrap, codec })

export { UserName }
