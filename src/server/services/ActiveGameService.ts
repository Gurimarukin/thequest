import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { Maybe } from '../../shared/utils/fp'
import { Future, IO, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { ActiveGame } from '../models/activeGame/ActiveGame'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { ActiveGamePersistence } from '../persistence/ActiveGamePersistence'
import { getOnError } from '../utils/getOnError'
import type { RiotApiService } from './RiotApiService'

type ActiveGameService = ReturnType<typeof of>

const ActiveGameService = (
  Logger: LoggerGetter,
  activeGamePersistence: ActiveGamePersistence,
  riotApiService: RiotApiService,
  cronJobObservable: TObservable<CronJobEvent>,
): IO<ActiveGameService> => {
  const logger = Logger('SummonerService')

  return pipe(
    cronJobObservable,
    TObservable.subscribe(getOnError(logger))({
      next: ({ date }) =>
        pipe(
          activeGamePersistence.deleteBeforeDate(
            pipe(date, DayJs.subtract(constants.riotApiCacheTtl.activeGame)),
          ),
          Future.map(toNotUsed),
        ),
    }),
    IO.map(() => of(activeGamePersistence, riotApiService)),
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (activeGamePersistence: ActiveGamePersistence, riotApiService: RiotApiService) => ({
  findBySummoner: (platform: Platform, summonerId: SummonerId): Future<Maybe<ActiveGame>> =>
    pipe(
      Future.fromIO(DayJs.now),
      Future.map(DayJs.subtract(constants.riotApiCacheTtl.activeGame)),
      Future.chain(insertedAfter =>
        activeGamePersistence.findBySummonerId(summonerId, insertedAfter),
      ),
      futureMaybe.alt<ActiveGame>(() =>
        pipe(
          riotApiService.riotgames
            .platform(platform)
            .lol.spectatorV4.activeGames.bySummoner(summonerId),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(game => activeGamePersistence.upsert(game)),
        ),
      ),
    ),
})

export { ActiveGameService }
