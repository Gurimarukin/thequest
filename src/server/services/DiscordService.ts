import type { OAuth2Code } from '../../shared/models/discord/OAuth2Code'
import type { Future } from '../../shared/utils/fp'
import { List } from '../../shared/utils/fp'

import type { ClientConfig } from '../config/Config'
import type { HttpClient } from '../helpers/HttpClient'
import { AccessToken } from '../models/discord/AccessToken'
import { DiscordConnection } from '../models/discord/DiscordConnection'
import { DiscordUser } from '../models/discord/DiscordUser'
import { OAuth2AccessTokenResult } from '../models/discord/OAuth2AccessTokenResult'
import { OAuth2AuthorizationCodePayload } from '../models/discord/OAuth2AuthorizationCodePayload'
import { OAuth2RefreshTokenPayload } from '../models/discord/OAuth2RefreshTokenPayload'
import type { RefreshToken } from '../models/discord/RefreshToken'

const apiEndpoint = 'https://discord.com/api'

type DiscordService = ReturnType<typeof DiscordService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const DiscordService = (clientConfig: ClientConfig, httpClient: HttpClient) => ({
  oauth2: {
    token: {
      post: {
        authorizationCode: (code: OAuth2Code): Future<OAuth2AccessTokenResult> =>
          httpClient.http(
            [`${apiEndpoint}/oauth2/token`, 'post'],
            {
              form: OAuth2AuthorizationCodePayload.encoder.encode({
                client_id: clientConfig.id,
                client_secret: clientConfig.secret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: clientConfig.redirectUri,
              }),
            },
            [OAuth2AccessTokenResult.decoder, 'OAuth2AccessTokenResult'],
          ),

        refreshToken: (refreshToken: RefreshToken): Future<OAuth2AccessTokenResult> =>
          httpClient.http(
            [`${apiEndpoint}/oauth2/token`, 'post'],
            {
              form: OAuth2RefreshTokenPayload.encoder.encode({
                client_id: clientConfig.id,
                client_secret: clientConfig.secret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
              }),
            },
            [OAuth2AccessTokenResult.decoder, 'OAuth2AccessTokenResult'],
          ),
      },
    },
  },
  users: {
    me: {
      get: (token: AccessToken): Future<DiscordUser> =>
        httpClient.http(
          [`${apiEndpoint}/users/@me`, 'get'],
          { headers: { authorization: authorizationHeader(token) } },
          [DiscordUser.decoder, 'DiscordUser'],
        ),

      connections: {
        get: (token: AccessToken): Future<List<DiscordConnection>> =>
          httpClient.http(
            [`${apiEndpoint}/users/@me/connections`, 'get'],
            { headers: { authorization: authorizationHeader(token) } },
            [List.decoder(DiscordConnection.decoder), 'List<DiscordConnection>'],
          ),
      },
    },
  },
})

export { DiscordService }

const authorizationHeader = (
  token: AccessToken,
): `${OAuth2AccessTokenResult['token_type']} ${string}` => `Bearer ${AccessToken.unwrap(token)}`
