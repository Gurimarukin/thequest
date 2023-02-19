import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { UserName } from '../../../shared/models/api/user/UserName'
import { Maybe } from '../../../shared/utils/fp'

import { HashedPassword } from './HashedPassword'
import { UserDiscordInfos } from './UserDiscordInfos'

type UserLogin = C.TypeOf<typeof codec>
type UserLoginDiscord = C.TypeOf<typeof discordCodec>
type UserLoginPassword = C.TypeOf<typeof passwordCodec>

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

const UserLogin = { codec }

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

export { UserLogin, UserLoginDiscord, UserLoginPassword }
