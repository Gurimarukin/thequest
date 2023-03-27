import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type DiscordUserId = Newtype<{ readonly DiscordUserId: unique symbol }, string>

const { unwrap } = iso<DiscordUserId>()

const codec = fromNewtype<DiscordUserId>(C.string)

const DiscordUserId = { unwrap, codec }

export { DiscordUserId }
