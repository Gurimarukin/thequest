import type { Platform } from '../../../shared/models/api/Platform'

import type { Puuid } from '../riot/Puuid'
import type { SummonerId } from './SummonerId'

type Summoner = {
  readonly id: SummonerId
  readonly puuid: Puuid
  readonly platform: Platform
  readonly name: string
  readonly profileIconId: number
  readonly summonerLevel: number
}

export { Summoner }
