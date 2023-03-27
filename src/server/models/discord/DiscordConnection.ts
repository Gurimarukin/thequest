import * as D from 'io-ts/Decoder'

import { createEnum } from '../../../shared/utils/createEnum'
import { List, Maybe } from '../../../shared/utils/fp'

const connectionService = createEnum(
  'battlenet',
  'ebay',
  'epicgames',
  'facebook',
  'github',
  'leagueoflegends',
  'paypal',
  'playstation',
  'reddit',
  'riotgames',
  'spotify',
  'skype',
  'steam',
  'twitch',
  'twitter',
  'xbox',
  'youtube',
)

const connectionVisibility = createEnum(0, 1)

type DiscordConnection = Readonly<D.TypeOf<typeof decoder>>

const decoder = D.struct({
  /**
   * ID of the connection account
   */
  id: D.string,
  /**
   * The username of the connection account
   */
  name: D.string,
  /**
   * The service of the connection
   *
   * See https://discord.com/developers/docs/resources/user#connection-object-services
   */
  type: connectionService.decoder,
  /**
   * Whether the connection is revoked
   */
  revoked: Maybe.decoder(D.boolean),
  /**
   * An array of partial server integrations
   *
   * See https://discord.com/developers/docs/resources/guild#integration-object
   */
  integrations: Maybe.decoder(List.decoder(D.id<unknown>())), // Partial<APIGuildIntegration>[]
  /**
   * Whether the connection is verified
   */
  verified: D.boolean,
  /**
   * Whether friend sync is enabled for this connection
   */
  friend_sync: D.boolean,
  /**
   * Whether activities related to this connection will be shown in presence updates
   */
  show_activity: D.boolean,
  /**
   * Whether this connection supports console voice transfer
   */
  two_way_link: D.boolean,
  /**
   * Visibility of this connection
   *
   * See https://discord.com/developers/docs/resources/user#connection-object-visibility-types
   */
  visibility: connectionVisibility.decoder,
})

const DiscordConnection = { decoder }

export { DiscordConnection }
