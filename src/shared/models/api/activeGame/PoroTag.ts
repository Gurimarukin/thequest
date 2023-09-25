import * as C from 'io-ts/Codec'

import { PoroNiceness } from './PoroNiceness'

type PoroTag = C.TypeOf<typeof codec>

const codec = C.struct({
  niceness: PoroNiceness.codec,
  label: C.string,
  tooltip: C.string,
})

const PoroTag = { codec }

export { PoroTag }
