import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type GameName = Newtype<{ readonly GameName: unique symbol }, string>

const { wrap } = iso<GameName>()

const codec = fromNewtype<GameName>(C.string)

const GameName = { wrap, codec }

export { GameName }
