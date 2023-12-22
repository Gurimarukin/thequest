import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

type GameId = Newtype<{ readonly GameId: unique symbol }, number>

const { wrap, unwrap } = iso<GameId>()

const codec = fromNewtype<GameId>(C.number)

const GameId = immutableAssign(wrap, { unwrap, codec })

export { GameId }
