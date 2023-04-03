import * as D from 'io-ts/Decoder'

import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { Maybe } from '../../../shared/utils/fp'

type DiscordUser = D.TypeOf<typeof decoder>

const decoder = D.struct({
  /**
   * The user's id
   */
  id: DiscordUserId.codec,
  /**
   * The user's username, not unique across the platform
   */
  username: D.string,
  /**
   * The user's 4-digit discord-tag
   */
  discriminator: D.string,
  /**
   * The user's avatar hash
   *
   * See https://discord.com/developers/docs/reference#image-formatting
   */
  avatar: Maybe.decoder(D.string),
  /**
   * Whether the user belongs to an OAuth2 application
   */
  bot: Maybe.decoder(D.boolean),
  /**
   * Whether the user is an Official Discord System user (part of the urgent message system)
   */
  system: Maybe.decoder(D.boolean),
  /**
   * Whether the user has two factor enabled on their account
   */
  mfa_enabled: Maybe.decoder(D.boolean),
  /**
   * The user's banner hash
   *
   * See https://discord.com/developers/docs/reference#image-formatting
   */
  banner: Maybe.decoder(D.string),
  /**
   * The user's banner color encoded as an integer representation of hexadecimal color code
   */
  accent_color: Maybe.decoder(D.number),
  /**
   * The user's chosen language option
   */
  locale: Maybe.decoder(D.string),
  /**
   * Whether the email on this account has been verified
   */
  verified: Maybe.decoder(D.boolean),
  /**
   * The user's email
   */
  email: Maybe.decoder(D.string),
  /**
   * The flags on a user's account
   *
   * See https://discord.com/developers/docs/resources/user#user-object-user-flags
   */
  flags: Maybe.decoder(D.number), // UserFlags
  /**
   * The type of Nitro subscription on a user's account
   *
   * See https://discord.com/developers/docs/resources/user#user-object-premium-types
   */
  premium_type: Maybe.decoder(D.number), // UserPremiumType,
  /**
   * The public flags on a user's account
   *
   * See https://discord.com/developers/docs/resources/user#user-object-user-flags
   */
  public_flags: Maybe.decoder(D.number), // UserFlags
})

const DiscordUser = { decoder }

export { DiscordUser }
