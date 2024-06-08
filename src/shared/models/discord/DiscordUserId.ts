import type { eq } from 'fp-ts'
import { ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

type DiscordUserId = Newtype<{ readonly DiscordUserId: unique symbol }, string>

const { wrap, unwrap } = iso<DiscordUserId>()

const codec = fromNewtype<DiscordUserId>(C.string)

const Ord: ord.Ord<DiscordUserId> = pipe(string.Ord, ord.contramap(unwrap))
const Eq: eq.Eq<DiscordUserId> = Ord

const DiscordUserId = immutableAssign(wrap, { codec, unwrap, Ord, Eq })

export { DiscordUserId }
