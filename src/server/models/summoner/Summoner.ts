import type { Platform } from '../../../shared/models/api/Platform'
import type { Puuid } from '../../../shared/models/api/summoner/Puuid'
import type { RiotId } from '../../../shared/models/riot/RiotId'
import type { SummonerName } from '../../../shared/models/riot/SummonerName'

import type { SummonerId } from './SummonerId'

type Summoner = {
  id: SummonerId
  puuid: Puuid
  platform: Platform
  name: SummonerName
  profileIconId: number
  summonerLevel: number
}

export { Summoner }

export type SummonerWithRiotId = Summoner & {
  riotId: RiotId
}
