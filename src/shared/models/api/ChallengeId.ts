import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

type ChallengeId = Newtype<{ readonly ChallengeId: unique symbol }, number>

const { wrap, unwrap } = iso<ChallengeId>()

const codec = fromNewtype<ChallengeId>(C.number)

const Eq: eq.Eq<ChallengeId> = pipe(number.Eq, eq.contramap(unwrap))

const ChallengeId = immutableAssign(wrap, { codec, Eq })

export { ChallengeId }
