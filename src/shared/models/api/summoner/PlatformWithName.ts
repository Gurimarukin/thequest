import * as C from 'io-ts/Codec'

import { SummonerName } from '../../riot/SummonerName'
import { Platform } from '../Platform'

type PlatformWithName = C.TypeOf<typeof codec>

const codec = C.struct({
  platform: Platform.codec,
  name: SummonerName.codec,
})

const PlatformWithName = { codec }

export { PlatformWithName }
