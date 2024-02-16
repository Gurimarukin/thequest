import { pipe } from 'fp-ts/function'
import qs from 'qs'

import { List } from '../../shared/utils/fp'

import { config } from '../config/unsafe'
import type { DiscordRedirectState } from '../domain/discordRedirect/DiscordRedirectState'

// https://discord.com/developers/docs/topics/oauth2#authorization-code-grant
export const discordApiOAuth2Authorize = (state: DiscordRedirectState): string =>
  `https://discord.com/api/oauth2/authorize?${qs.stringify({
    client_id: config.discordClient.id,
    redirect_uri: config.discordClient.redirectUri,
    response_type: 'code',
    scope: pipe(['identify', 'connections'], List.mkString(' ')),
    state,
  })}`
