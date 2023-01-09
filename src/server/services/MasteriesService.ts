import type { RiotApiService } from './RiotApiService'

type MasteriesService = ReturnType<typeof MasteriesService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MasteriesService = (riotApiService: RiotApiService) => {
  const { championMasteryBySummoner: findBySummoner } = riotApiService.lol
  return { findBySummoner }
}

export { MasteriesService }
