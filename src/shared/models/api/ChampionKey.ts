import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type ChampionKey = Newtype<{ readonly ChampionId: unique symbol }, number>

const { unwrap } = iso<ChampionKey>()

const codec = fromNewtype<ChampionKey>(C.number)

const ChampionKey = { unwrap, codec }

export { ChampionKey }
