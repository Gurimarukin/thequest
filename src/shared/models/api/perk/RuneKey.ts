import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

type RuneKey = Newtype<{ readonly RuneKey: unique symbol }, string>

const codec = fromNewtype<RuneKey>(C.string)

const RuneKey = { codec }

export { RuneKey }
