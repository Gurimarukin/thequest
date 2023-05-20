import type { Platform } from '../../shared/models/api/Platform'
import type { Future, Maybe } from '../../shared/utils/fp'

import type { RiotCurrentGameInfo } from '../models/riot/currentGame/RiotCurrentGameInfo'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { RiotApiService } from './RiotApiService'

type ActiveGameService = ReturnType<typeof ActiveGameService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ActiveGameService = (riotApiService: RiotApiService) => ({
  findBySummoner: (
    platform: Platform,
    summonerId: SummonerId,
  ): Future<Maybe<RiotCurrentGameInfo>> =>
    riotApiService.riotgames.platform(platform).lol.spectatorV4.activeGames.bySummoner(summonerId),
})

export { ActiveGameService }
