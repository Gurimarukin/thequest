import type { Platform } from '../../../shared/models/api/Platform'
import type { Puuid } from '../../../shared/models/api/summoner/Puuid'

import type { SummonerId } from './SummonerId'

type Summoner = {
  id: SummonerId
  puuid: Puuid
  platform: Platform
  name: string
  profileIconId: number
  summonerLevel: number
}

export { Summoner }
