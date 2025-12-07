import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../utils/fp'
import { fromNewtype } from '../../../utils/ioTsUtils'

type RuneStyleId = Newtype<{ readonly RuneStyleId: unique symbol }, number>

const { wrap, unwrap } = iso<RuneStyleId>()

const codec = fromNewtype<RuneStyleId>(C.number)

const Eq: eq.Eq<RuneStyleId> = pipe(number.Eq, eq.contramap(unwrap))

const RuneStyleId = immutableAssign(wrap, { codec, Eq })

export { RuneStyleId }
