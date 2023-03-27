import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'
import { lens } from 'monocle-ts'

import { UserName } from '../../../shared/models/api/user/UserName'
import { List } from '../../../shared/utils/fp'

import { PlatformWithPuuid } from '../PlatformWithPuuid'
import { UserId } from './UserId'
import { UserLogin } from './UserLogin'

type User<A extends UserLogin> = {
  readonly id: UserId
  readonly login: A
  readonly favoriteSearches: List<PlatformWithPuuid>
}

type UserOutput = E.OutputOf<typeof encoder>

const decoder = <A extends UserLogin>(
  loginDecoder: Decoder<unknown, A>,
): Decoder<unknown, User<A>> =>
  D.struct({
    id: UserId.codec,
    login: loginDecoder,
    favoriteSearches: List.codec(PlatformWithPuuid.codec),
  })

const encoder = E.struct({
  id: UserId.codec,
  login: UserLogin.codec,
  favoriteSearches: List.encoder(PlatformWithPuuid.codec),
})

const codec: Codec<unknown, UserOutput, User<UserLogin>> = C.make(decoder(UserLogin.codec), encoder)

const of = <A extends UserLogin>(
  id: UserId,
  login: A,
  favoriteSearches: List<PlatformWithPuuid>,
): User<A> => ({ id, login, favoriteSearches })

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

const User = { decoder, codec, of, userName, Lens }

export { User, UserOutput }
