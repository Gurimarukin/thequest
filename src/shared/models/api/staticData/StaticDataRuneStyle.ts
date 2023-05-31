import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { RuneId } from '../perk/RuneId'
import { RuneStyleId } from '../perk/RuneStyleId'

type StaticDataRuneStyle = C.TypeOf<typeof codec>

const codec = C.struct({
  id: RuneStyleId.codec,
  icon: C.string,
  name: C.string,
  slots: List.codec(
    C.struct({
      runes: List.codec(RuneId.codec),
    }),
  ),
})

const StaticDataRuneStyle = { codec }

export { StaticDataRuneStyle }
