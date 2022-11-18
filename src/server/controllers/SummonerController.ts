import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { Platform } from '../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Either } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'

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
      futureEither.fromTaskEitherOptionK(() => 'Summoner not found'),
      futureEither.bindTo('summoner'),
      futureEither.bind('masteries', ({ summoner }) =>
        pipe(
          riotApiService.lol.championMasteryBySummoner(platform, summoner.id),
          futureEither.fromTaskEitherOptionK(() => 'Masteries not found'),
        ),
      ),
      M.fromTaskEither,
      M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(SummonerMasteriesView.codec))),
    ),
})

export { SummonerController }
