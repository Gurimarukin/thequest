import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type Puuid = Newtype<{ readonly Puuid: unique symbol }, string>

const { unwrap } = iso<Puuid>()

const codec = fromNewtype<Puuid>(C.string)

const Puuid = { unwrap, codec }

export { Puuid }
