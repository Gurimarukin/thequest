import * as E from 'io-ts/Encoder'

import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { OAuth2Code } from '../../../shared/models/discord/OAuth2Code'

import { ClientSecret } from './ClientSecret'

type OAuth2AuthorizationCodePayload = Readonly<E.TypeOf<typeof encoder>>

const encoder = E.struct({
  client_id: DiscordUserId.codec,
  client_secret: ClientSecret.codec,
  grant_type: E.id<'authorization_code'>(),
  code: OAuth2Code.codec,
  redirect_uri: E.id<string>(),
})

const OAuth2AuthorizationCodePayload = { encoder }

export { OAuth2AuthorizationCodePayload }
