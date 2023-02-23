import type { SummonerId } from '../../../shared/models/api/summoner/SummonerId'

import type { Puuid } from '../riot/Puuid'

type Summoner = {
  readonly id: SummonerId
  readonly puuid: Puuid
  readonly name: string
  readonly profileIconId: number
  readonly summonerLevel: number
}

export { Summoner }
