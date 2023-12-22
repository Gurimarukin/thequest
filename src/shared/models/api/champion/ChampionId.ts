import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

// Champion's name, but without special chars
// MonkeyKing

type ChampionId = Newtype<{ readonly ChampionId: unique symbol }, string>

const codec = fromNewtype<ChampionId>(C.string)

const ChampionId = { codec }

export { ChampionId }
