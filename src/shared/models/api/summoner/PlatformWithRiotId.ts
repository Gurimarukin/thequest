import { eq } from 'fp-ts'

import { RiotId } from '../../riot/RiotId'
import { Platform } from '../Platform'

type PlatformWithRiotId = {
  platform: Platform
  riotId: RiotId
}

const Eq: eq.Eq<PlatformWithRiotId> = eq.struct({
  platform: Platform.Eq,
  riotId: RiotId.Eq,
})

const PlatformWithRiotId = { Eq }

export { PlatformWithRiotId }
