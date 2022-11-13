import * as C from 'io-ts/Codec'

import { UserName } from '../../../shared/models/api/user/UserName'

import { HashedPassword } from './HashedPassword'
import { UserId } from './UserId'

type User = C.TypeOf<typeof codec>

const codec = C.struct({
  id: UserId.codec,
  userName: UserName.codec,
  password: HashedPassword.codec,
})

const of = (id: UserId, userName: UserName, password: HashedPassword): User => ({
  id,
  userName,
  password,
})

const User = { codec, of }

export { User }
