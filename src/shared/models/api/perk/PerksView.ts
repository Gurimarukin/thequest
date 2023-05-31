import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { RuneId } from './RuneId'
import { RuneStyleId } from './RuneStyleId'

type PerksView = C.TypeOf<typeof codec>

const codec = C.struct({
  perkIds: List.codec(RuneId.codec),
  perkStyle: RuneStyleId.codec,
  perkSubStyle: RuneStyleId.codec,
})

const PerksView = { codec }

export { PerksView }
