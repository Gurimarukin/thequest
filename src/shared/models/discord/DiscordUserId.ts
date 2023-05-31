import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type DiscordUserId = Newtype<{ readonly DiscordUserId: unique symbol }, string>

const codec = fromNewtype<DiscordUserId>(C.string)

const DiscordUserId = { codec }

export { DiscordUserId }
