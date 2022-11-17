import * as C from 'io-ts/Codec'

import { Platform } from '../../shared/models/api/Platform'

import { Puuid } from './riot/Puuid'

type PlatformWithPuuid = C.TypeOf<typeof codec>

const codec = C.struct({
  platform: Platform.codec,
  puuid: Puuid.codec,
})

const PlatformWithPuuid = { codec }

export { PlatformWithPuuid }
