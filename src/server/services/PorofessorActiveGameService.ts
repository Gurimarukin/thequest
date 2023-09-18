import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { MsDuration } from '../../shared/models/MsDuration'
import { Platform } from '../../shared/models/api/Platform'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { Maybe } from '../../shared/utils/fp'
import { Future, IO, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { HttpClient } from '../helpers/HttpClient'
import type { PorofessorActiveGame } from '../models/activeGame/PorofessorActiveGame'
import type { PorofessorActiveGameDb } from '../models/activeGame/PorofessorActiveGameDb'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { GameId } from '../models/riot/GameId'
import type { PorofessorActiveGamePersistence } from '../persistence/PorofessorActiveGamePersistence'
import { getOnError } from '../utils/getOnError'

type PorofessorActiveGameService = ReturnType<typeof of>

const PorofessorActiveGameService = (
  cacheTtl: MsDuration,
  Logger: LoggerGetter,
  porofessorActiveGamePersistence: PorofessorActiveGamePersistence,
  httpClient: HttpClient,
  cronJobObservable: TObservable<CronJobEvent>,
): IO<PorofessorActiveGameService> => {
  const logger = Logger('SummonerService')

  return pipe(
    cronJobObservable,
    TObservable.subscribe(getOnError(logger))({
      next: ({ date }) =>
        pipe(
          porofessorActiveGamePersistence.deleteBeforeDate(pipe(date, DayJs.subtract(cacheTtl))),
          Future.map(toNotUsed),
        ),
    }),
    IO.map(() => of(porofessorActiveGamePersistence, httpClient)),
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  porofessorActiveGamePersistence: PorofessorActiveGamePersistence,
  httpClient: HttpClient,
) => {
  return {
    find: (
      gameId: GameId,
      platform: Platform,
      summonerName: string,
    ): Future<Maybe<PorofessorActiveGame>> =>
      pipe(
        porofessorActiveGamePersistence.findById(gameId),
        futureMaybe.alt<PorofessorActiveGame>(() =>
          pipe(
            fetch(platform, summonerName),
            futureMaybe.bindTo('game'),
            futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
            futureMaybe.map(
              ({ game, insertedAt }): PorofessorActiveGameDb => ({
                ...game,
                insertedAt,
              }),
            ),
            futureMaybe.chainFirstTaskEitherK(porofessorActiveGamePersistence.upsert),
          ),
        ),
      ),
  }

  function fetch(platform: Platform, summonerName: string): Future<Maybe<PorofessorActiveGame>> {
    const res = pipe(
      httpClient.text([
        `https://porofessor.gg/partial/live-partial/${Platform.encoderLower.encode(
          platform,
        )}/${summonerName}`,
        'get',
      ]),
    )
    return Future.todo()
  }
}

export { PorofessorActiveGameService }
