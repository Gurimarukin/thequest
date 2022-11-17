import type { Puuid } from '../riot/Puuid'
import type { SummonerId } from '../riot/SummonerId'

type Summoner = {
  readonly id: SummonerId
  readonly puuid: Puuid
  readonly name: string
  readonly profileIconId: number
  readonly summonerLevel: number
}

export { Summoner }
