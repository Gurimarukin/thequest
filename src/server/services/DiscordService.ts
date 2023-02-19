import type { OAuth2Code } from '../../shared/models/discord/OAuth2Code'
import type { Future } from '../../shared/utils/fp'

import type { ClientConfig } from '../config/Config'
import { constants } from '../config/constants'
import type { HttpClient } from '../helpers/HttpClient'
import { AccessToken } from '../models/discord/AccessToken'
import { DiscordUser } from '../models/discord/DiscordUser'
import { OAuth2AccessTokenPayload } from '../models/discord/OAuth2AccessTokenPayload'
import { OAuth2AccessTokenResult } from '../models/discord/OAuth2AccessTokenResult'

const apiEndpoint = constants.discord.apiEndpoint

type DiscordService = ReturnType<typeof DiscordService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const DiscordService = (clientConfig: ClientConfig, httpClient: HttpClient) => ({
  oauth2: {
    token: {
      post: (code: OAuth2Code): Future<OAuth2AccessTokenResult> =>
        httpClient.http(
          [`${apiEndpoint}/oauth2/token`, 'post'],
          {
            form: OAuth2AccessTokenPayload.encoder.encode({
              client_id: clientConfig.id,
              client_secret: clientConfig.secret,
              grant_type: 'authorization_code',
              code,
              redirect_uri: clientConfig.redirectUri,
            }),
          },
          [OAuth2AccessTokenResult.decoder, 'OAuth2AccessTokenResult'],
        ),
    },
  },
  users: {
    me: {
      get: (token: AccessToken): Future<DiscordUser> =>
        httpClient.http(
          [`${apiEndpoint}/users/@me`, 'get'],
          {
            headers: { authorization: authorizationHeader(token) },
          },
          [DiscordUser.decoder, 'DiscordUser'],
        ),
    },
  },
})

export { DiscordService }

const authorizationHeader = (
  token: AccessToken,
): `${OAuth2AccessTokenResult['token_type']} ${string}` => `Bearer ${AccessToken.unwrap(token)}`
