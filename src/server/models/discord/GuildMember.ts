import * as D from 'io-ts/Decoder'

import { DiscordUser } from './DiscordUser'

type GuildMember = D.TypeOf<typeof decoder>

const decoder = D.struct({
  user: DiscordUser.decoder,
})

const GuildMember = { decoder }

export { GuildMember }
