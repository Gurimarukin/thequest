import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type GameId = Newtype<{ readonly GameId: unique symbol }, number>

const codec = fromNewtype<GameId>(C.number)

const GameId = { codec }

export { GameId }
