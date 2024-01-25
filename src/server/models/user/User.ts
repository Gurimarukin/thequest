import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'
import { lens } from 'monocle-ts'
import type { IsEqual } from 'type-fest'

import { PlatformWithPuuid } from '../../../shared/models/api/summoner/PlatformWithPuuid'
import { UserName } from '../../../shared/models/api/user/UserName'
import { UserRole } from '../../../shared/models/api/user/UserRole'
import type { Expect } from '../../../shared/models/typeUtils'
import { List, immutableAssign } from '../../../shared/utils/fp'

import { UserId } from './UserId'
import { UserLogin } from './UserLogin'

type User<A extends UserLogin> = {
  id: UserId
  login: A
  favoriteSearches: List<PlatformWithPuuid>
  role: UserRole
}

type UserOutput = E.OutputOf<typeof encoder>

const decoder = <A extends UserLogin>(
  loginDecoder: Decoder<unknown, A>,
): Decoder<unknown, User<A>> =>
  D.struct({
    id: UserId.codec,
    login: loginDecoder,
    favoriteSearches: List.codec(PlatformWithPuuid.codec),
    role: UserRole.codec,
  })

const encoder = E.struct({
  id: UserId.codec,
  login: UserLogin.codec,
  favoriteSearches: List.encoder(PlatformWithPuuid.codec),
  role: UserRole.encoder,
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TestEncoder = Expect<IsEqual<E.TypeOf<typeof encoder>, User<UserLogin>>>

const codec: Codec<unknown, UserOutput, User<UserLogin>> = C.make(decoder(UserLogin.codec), encoder)

function construct<A extends UserLogin>(
  id: UserId,
  login: A,
  favoriteSearches: List<PlatformWithPuuid>,
  role: UserRole,
): User<A> {
  return { id, login, favoriteSearches, role }
}

const userName = (user: User<UserLogin>): string => {
  switch (user.login.type) {
    case 'Discord':
      return user.login.username
    case 'Password':
      return UserName.unwrap(user.login.userName)
  }
}

const Lens = {
  login: pipe(lens.id<User<UserLogin>>(), lens.prop('login')),
}

const User = immutableAssign(construct, { decoder, codec, userName, Lens })

export { User, UserOutput }
