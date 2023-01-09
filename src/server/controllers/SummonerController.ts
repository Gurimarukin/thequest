import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { Platform } from '../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Either, Future } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'

import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerService } from '../services/SummonerService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type SummonerController = ReturnType<typeof SummonerController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerController = (
  summonerService: SummonerService,
  masteriesService: MasteriesService,
) => ({
  findByName: (platform: Platform, summonerName: string): EndedMiddleware =>
    pipe(
      summonerService.findByName(platform, summonerName),
      Future.map(Either.fromOption(() => 'Summoner not found')),
      futureEither.bindTo('summoner'),
      futureEither.bind('masteries', ({ summoner }) =>
        pipe(
          masteriesService.findBySummoner(platform, summoner.id),
          Future.map(Either.fromOption(() => 'Masteries not found')),
        ),
      ),
      M.fromTaskEither,
      M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(SummonerMasteriesView.codec))),
    ),
})

export { SummonerController }
