import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { LeagueTier } from '../league/LeagueTier'

type ChallengeView = C.TypeOf<typeof codec>

const codec = C.struct({
  level: Maybe.codec(LeagueTier.codec),
  value: C.number,
})

const ChallengeView = { codec }

export { ChallengeView }
