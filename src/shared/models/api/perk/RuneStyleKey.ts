import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

type RuneStyleKey = Newtype<{ readonly RuneStyleKey: unique symbol }, string>

const codec = fromNewtype<RuneStyleKey>(C.string)

const RuneStyleKey = { codec }

export { RuneStyleKey }
