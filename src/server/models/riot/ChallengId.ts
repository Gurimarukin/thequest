import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type ChallengeId = Newtype<{ readonly ChallengeId: unique symbol }, number>

const { unwrap } = iso<ChallengeId>()

const codec = fromNewtype<ChallengeId>(C.number)

const ChallengeId = { unwrap, codec }

export { ChallengeId }
