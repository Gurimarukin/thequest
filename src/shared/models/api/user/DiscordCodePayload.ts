import * as C from 'io-ts/Codec'

import { OAuth2Code } from '../../discord/OAuth2Code'

type DiscordCodePayload = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  code: OAuth2Code.codec,
})

const DiscordCodePayload = { codec }

export { DiscordCodePayload }
