import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type LeagueId = Newtype<{ readonly LeagueId: unique symbol }, string>

const codec = fromNewtype<LeagueId>(C.string)

const LeagueId = { codec }

export { LeagueId }
