import { ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { TObservable } from '../../shared/models/rx/TObservable'
import { Future, IO, Maybe, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import type { ActiveGame } from '../models/activeGame/ActiveGame'
import type { ActiveGameDb } from '../models/activeGame/ActiveGameDb'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { ActiveGamePersistence } from '../persistence/ActiveGamePersistence'
import { getOnError } from '../utils/getOnError'
import type { RiotApiService } from './RiotApiService'

type ActiveGameService = ReturnType<typeof of>

const ActiveGameService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
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
            pipe(date, DayJs.subtract(riotApiCacheTtl.activeGame)),
          ),
          Future.map(toNotUsed),
        ),
    }),
    IO.map(() => of(riotApiCacheTtl, activeGamePersistence, riotApiService)),
  )
}

const of = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  activeGamePersistence: ActiveGamePersistence,
  riotApiService: RiotApiService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return {
    findBySummoner: (platform: Platform, puuid: Puuid): Future<Maybe<ActiveGame>> =>
      pipe(
        futureMaybe.fromIO(DayJs.now),
        futureMaybe.bindTo('now'),
        futureMaybe.bind('game', ({ now }) => {
          const insertedAfter = pipe(now, DayJs.subtract(riotApiCacheTtl.activeGame))
          return activeGamePersistence.findByPuuid(puuid, insertedAfter)
        }),
        futureMaybe.chain(({ now, game }) => {
          const gameIsLoading = Maybe.isNone(game.gameStartTime)
          if (!gameIsLoading) return futureMaybe.some(game)

          const updatedAfter = pipe(now, DayJs.subtract(riotApiCacheTtl.activeGameLoading))
          if (ord.leq(DayJs.Ord)(updatedAfter, game.updatedAt)) return futureMaybe.some(game)

          return fetchAndCache(platform, puuid, Maybe.some(game.insertedAt))
        }),
        futureMaybe.alt<ActiveGame>(() => fetchAndCache(platform, puuid, Maybe.none)),
      ),
  }

  function fetchAndCache(
    platform: Platform,
    puuid: Puuid,
    maybeInsertedAt: Maybe<DayJs>,
  ): Future<Maybe<ActiveGame>> {
    return pipe(
      riotApiService.riotgames.platform(platform).lol.spectatorV5.activeGames.bySummoner(puuid),
      futureMaybe.bindTo('game'),
      futureMaybe.bind('now', () => futureMaybe.fromIO(DayJs.now)),
      futureMaybe.map(
        ({ game, now }): ActiveGameDb => ({
          ...game,
          insertedAt: pipe(
            maybeInsertedAt,
            Maybe.getOrElse(() => now),
          ),
          updatedAt: now,
        }),
      ),
      futureMaybe.chainFirstTaskEitherK(activeGamePersistence.upsert),
    )
  }
}

export { ActiveGameService }
