import * as C from 'io-ts/Codec'

import { ItemId } from '../ItemId'

type StaticDataItem = C.TypeOf<typeof codec>

const codec = C.struct({
  id: ItemId.codec,
  name: C.string,
  description: C.string,
  plaintext: C.string,
  image: C.string,
})

const StaticDataItem = { codec }

export { StaticDataItem }
