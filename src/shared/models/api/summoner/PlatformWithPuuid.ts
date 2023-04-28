import * as C from 'io-ts/Codec'

import { Platform } from '../Platform'
import { Puuid } from './Puuid'

type PlatformWithPuuid = C.TypeOf<typeof codec>

const codec = C.struct({
  platform: Platform.codec,
  puuid: Puuid.codec,
})

const PlatformWithPuuid = { codec }

export { PlatformWithPuuid }
