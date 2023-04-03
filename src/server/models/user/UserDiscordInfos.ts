import * as C from 'io-ts/Codec'

import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { AccessToken } from '../discord/AccessToken'
import { RefreshToken } from '../discord/RefreshToken'

type UserDiscordInfos = C.TypeOf<typeof codec>

const codec = C.struct({
  id: DiscordUserId.codec,
  username: C.string,
  discriminator: C.string,
  accessToken: AccessToken.codec,
  expiresAt: DayJsFromDate.codec,
  refreshToken: RefreshToken.codec,
})

const UserDiscordInfos = { codec }

export { UserDiscordInfos }
