import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import { LeagueTier } from '../league/LeagueTier'

type ChallengeView = C.TypeOf<typeof codec>

const codec = C.struct({
  percentile: C.number,
  level: Maybe.codec(LeagueTier.codec),
  value: C.number,
  achievedTime: Maybe.codec(DayJsFromISOString.codec),
})

const ChallengeView = { codec }

export { ChallengeView }
