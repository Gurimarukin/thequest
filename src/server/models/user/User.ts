import * as C from 'io-ts/Codec'

import { UserName } from '../../../shared/models/api/user/UserName'
import { List } from '../../../shared/utils/fp'

import { PlatformWithPuuid } from '../PlatformWithPuuid'
import { HashedPassword } from './HashedPassword'
import { UserId } from './UserId'

type User = C.TypeOf<typeof codec>
type UserOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  id: UserId.codec,
  userName: UserName.codec,
  password: HashedPassword.codec,
  favoriteSearches: List.codec(PlatformWithPuuid.codec),
})

const of = (
  id: UserId,
  userName: UserName,
  password: HashedPassword,
  favoriteSearches: List<PlatformWithPuuid>,
): User => ({
  id,
  userName,
  password,
  favoriteSearches,
})

const User = { codec, of }

export { User, UserOutput }
