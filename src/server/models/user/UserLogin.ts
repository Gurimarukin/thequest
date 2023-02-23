import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { UserName } from '../../../shared/models/api/user/UserName'
import { Maybe } from '../../../shared/utils/fp'

import { HashedPassword } from './HashedPassword'
import { UserDiscordInfos } from './UserDiscordInfos'

type UserLogin = Readonly<C.TypeOf<typeof codec>>
type UserLoginDiscord = Readonly<C.TypeOf<typeof discordCodec>>
type UserLoginPassword = Readonly<C.TypeOf<typeof passwordCodec>>

const discordCodec = pipe(
  C.struct({
    type: C.literal('Discord'),
  }),
  C.intersect(UserDiscordInfos.codec),
)

const passwordCodec = C.struct({
  type: C.literal('Password'),
  userName: UserName.codec,
  password: HashedPassword.codec,
  discord: Maybe.codec(UserDiscordInfos.codec),
})

const codec = C.sum('type')({
  Discord: discordCodec,
  Password: passwordCodec,
})

const UserLoginDiscord = {
  codec: discordCodec,
  of: (discord: UserDiscordInfos): UserLoginDiscord => ({ type: 'Discord', ...discord }),
}

const UserLoginPassword = {
  codec: passwordCodec,
  of: (
    userName: UserName,
    password: HashedPassword,
    discord: Maybe<UserDiscordInfos>,
  ): UserLoginPassword => ({ type: 'Password', userName, password, discord }),
}

const UserLogin = {
  codec,

  discordInfos: (login: UserLogin): Maybe<UserDiscordInfos> => {
    switch (login.type) {
      case 'Discord':
        const {
          type: {},
          ...discord
        } = login
        return Maybe.some(discord)
      case 'Password':
        return login.discord
    }
  },

  setDiscordInfos:
    (discord: UserDiscordInfos) =>
    <A extends UserLogin>(login: A): A => {
      switch (login.type) {
        case 'Discord':
          return UserLoginDiscord.of(discord) as A
        case 'Password':
          return UserLoginPassword.of(login.userName, login.password, Maybe.some(discord)) as A
      }
    },
}

export { UserLogin, UserLoginDiscord, UserLoginPassword }
