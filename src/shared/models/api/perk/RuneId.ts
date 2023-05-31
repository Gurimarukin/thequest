import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

type RuneId = Newtype<{ readonly RuneId: unique symbol }, number>

const { unwrap } = iso<RuneId>()

const codec = fromNewtype<RuneId>(C.number)

const Eq: eq.Eq<RuneId> = pipe(number.Eq, eq.contramap(unwrap))

const RuneId = { codec, Eq }

export { RuneId }
