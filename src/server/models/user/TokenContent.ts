import * as C from 'io-ts/Codec'

import { UserRole } from '../../../shared/models/api/user/UserRole'

import { UserId } from './UserId'

type TokenContent = C.TypeOf<typeof codec>

const codec = C.struct({
  id: UserId.codec,
  role: UserRole.codec,
})

const TokenContent = { codec }

export { TokenContent }
