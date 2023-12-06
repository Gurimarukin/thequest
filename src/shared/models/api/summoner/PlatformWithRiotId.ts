import type { RiotId } from '../../riot/RiotId'
import type { Platform } from '../Platform'

type PlatformWithRiotId = {
  platform: Platform
  riotId: RiotId
}

export { PlatformWithRiotId }
