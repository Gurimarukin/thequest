import * as C from 'io-ts/Codec'

import { RuneId } from '../perk/RuneId'

type StaticDataRune = C.TypeOf<typeof codec>

const codec = C.struct({
  id: RuneId.codec,
  name: C.string,
  longDesc: C.string,
  iconPath: C.string,
})

const StaticDataRune = { codec }

export { StaticDataRune }
