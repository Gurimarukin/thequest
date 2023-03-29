import * as C from 'io-ts/Codec'

import { Platform } from '../Platform'

type PlatformWithName = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  platform: Platform.codec,
  name: C.string,
})

const PlatformWithName = { codec }

export { PlatformWithName }
