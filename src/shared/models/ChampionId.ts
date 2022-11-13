import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../utils/ioTsUtils'

type ChampionId = Newtype<{ readonly ChampionId: unique symbol }, number>

const { unwrap } = iso<ChampionId>()

const codec = fromNewtype<ChampionId>(C.number)

const ChampionId = { unwrap, codec }

export { ChampionId }
