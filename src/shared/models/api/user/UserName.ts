import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { NonEmptyString, fromNewtype } from '../../../utils/ioTsUtils'

type UserName = Newtype<{ readonly UserName: unique symbol }, string>

const { wrap, unwrap } = iso<UserName>()

const codec = fromNewtype<UserName>(NonEmptyString.codec)

const UserName = { wrap, unwrap, codec }

export { UserName }
