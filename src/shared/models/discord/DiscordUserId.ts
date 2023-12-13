import { eq, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type DiscordUserId = Newtype<{ readonly DiscordUserId: unique symbol }, string>

const { unwrap } = iso<DiscordUserId>()

const codec = fromNewtype<DiscordUserId>(C.string)

const Eq: eq.Eq<DiscordUserId> = pipe(string.Eq, eq.contramap(unwrap))

const DiscordUserId = { codec, Eq }

export { DiscordUserId }
