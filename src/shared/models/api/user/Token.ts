import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

type Token = Newtype<{ readonly Token: unique symbol }, string>

const { wrap, unwrap } = iso<Token>()

const codec = fromNewtype<Token>(C.string)

const Token = { wrap, unwrap, codec }

export { Token }
