import * as C from 'io-ts/Codec'

import { Maybe } from '../../utils/fp'
import { WikiaStatsBalance } from '../wikia/WikiaStatsBalance'

type AramData = C.TypeOf<typeof codec>

const codec = C.struct({
  stats: Maybe.codec(WikiaStatsBalance.codec),
})

const AramData = { codec }

export { AramData }
