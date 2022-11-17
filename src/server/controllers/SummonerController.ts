import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { Platform } from '../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiService } from '../services/RiotApiService'
import type { SummonerService } from '../services/SummonerService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type SummonerController = ReturnType<typeof SummonerController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerController = (riotApiService: RiotApiService, summonerService: SummonerService) => ({
  findByName: (platform: Platform, summonerName: string): EndedMiddleware =>
    pipe(
      summonerService.findByName(platform, summonerName),
      futureMaybe.bindTo('summoner'),
      futureMaybe.bind('masteries', ({ summoner }) =>
        riotApiService.lol.championMasteryBySummoner(platform, summoner.id),
      ),
      M.fromTaskEither,
      M.ichain(
        Maybe.fold(
          () => M.sendWithStatus(Status.NotFound)('Summoner not found'),
          M.json(SummonerMasteriesView.codec),
        ),
      ),
    ),
})

export { SummonerController }
