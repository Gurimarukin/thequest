import * as E from 'io-ts/Encoder'

import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'

import { ClientSecret } from './ClientSecret'
import { RefreshToken } from './RefreshToken'

type OAuth2RefreshTokenPayload = Readonly<E.TypeOf<typeof encoder>>

const encoder = E.struct({
  client_id: DiscordUserId.codec,
  client_secret: ClientSecret.codec,
  grant_type: E.id<'refresh_token'>(),

  refresh_token: RefreshToken.codec,
})

const OAuth2RefreshTokenPayload = { encoder }

export { OAuth2RefreshTokenPayload }
