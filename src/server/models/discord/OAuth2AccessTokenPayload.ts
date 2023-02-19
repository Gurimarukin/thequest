import * as E from 'io-ts/Encoder'

import { OAuth2Code } from '../../../shared/models/discord/OAuth2Code'

import { ClientSecret } from './ClientSecret'
import { DiscordUserId } from './DiscordUserId'

type OAuth2AccessTokenPayload = E.TypeOf<typeof encoder>

const encoder = E.struct({
  client_id: DiscordUserId.codec,
  client_secret: ClientSecret.codec,
  grant_type: E.id<'authorization_code'>(),
  code: OAuth2Code.codec,
  redirect_uri: E.id<string>(),
})

const OAuth2AccessTokenPayload = { encoder }

export { OAuth2AccessTokenPayload }
