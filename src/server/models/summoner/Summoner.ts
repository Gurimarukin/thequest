import type { Platform } from '../../../shared/models/api/Platform'
import type { Puuid } from '../../../shared/models/api/summoner/Puuid'
import type { RiotId } from '../../../shared/models/riot/RiotId'
import type { SummonerName } from '../../../shared/models/riot/SummonerName'
import type { Maybe } from '../../../shared/utils/fp'

import type { SummonerId } from './SummonerId'

type Summoner = {
  id: SummonerId
  puuid: Puuid
  platform: Platform
  name: Maybe<SummonerName>
  profileIconId: number
  summonerLevel: number
}

export { Summoner }

export type SummonerWithRiotId = Summoner & {
  riotId: RiotId
}
