import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { DiscordUserId } from '../../discord/DiscordUserId'

type DiscordUserView = C.TypeOf<typeof codec>

const codec = C.struct({
  id: DiscordUserId.codec,
  username: C.string,
  global_name: Maybe.codec(C.string),
  avatar: Maybe.codec(C.string),
})

const DiscordUserView = { codec }

export { DiscordUserView }
