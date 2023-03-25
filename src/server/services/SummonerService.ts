import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { Maybe } from '../../shared/utils/fp'
import { Future, IO, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { Puuid } from '../models/riot/Puuid'
import type { RiotSummoner } from '../models/riot/RiotSummoner'
import type { Summoner } from '../models/summoner/Summoner'
import type { SummonerDb } from '../models/summoner/SummonerDb'
import type { SummonerPersistence } from '../persistence/SummonerPersistence'
import { getOnError } from '../utils/getOnError'
import type { RiotApiService } from './RiotApiService'

type ForceCacheRefresh = {
  readonly forceCacheRefresh: boolean
}

type SummonerService = Readonly<ReturnType<typeof of>>

const SummonerService = (
  Logger: LoggerGetter,
  riotApiService: RiotApiService,
  summonerPersistence: SummonerPersistence,
  cronJobObservable: TObservable<CronJobEvent>,
): IO<SummonerService> => {
  const logger = Logger('SummonerService')

  return pipe(
    cronJobObservable,
    TObservable.subscribe(getOnError(logger))({
      next: ({ date }) => pipe(summonerPersistence.deleteBeforeDate(date), Future.map(toNotUsed)),
    }),
    IO.map(() => of(riotApiService, summonerPersistence)),
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (riotApiService: RiotApiService, summonerPersistence: SummonerPersistence) => {
  return {
    findByName: (
      platform: Platform,
      summonerName: string,
      { forceCacheRefresh }: ForceCacheRefresh = { forceCacheRefresh: false },
    ): Future<Maybe<Summoner>> =>
      findAndCache(
        platform,
        insertedAfter => summonerPersistence.findByName(platform, summonerName, insertedAfter),
        riotApiService.lol.summoner.byName(platform, summonerName),
        { forceCacheRefresh },
      ),

    findByPuuid: (
      platform: Platform,
      encryptedPUUID: Puuid,
      { forceCacheRefresh }: ForceCacheRefresh = { forceCacheRefresh: false },
    ): Future<Maybe<Summoner>> =>
      findAndCache(
        platform,
        insertedAfter => summonerPersistence.findByPuuid(encryptedPUUID, insertedAfter),
        riotApiService.lol.summoner.byPuuid(platform, encryptedPUUID),
        { forceCacheRefresh },
      ),

    deleteByPlatformAndPuuid: summonerPersistence.deleteByPuuid,
  }

  /**
   * If `fromPersistence` is not found (taking cache ttl into account), call `fromApi` and persist result
   */
  function findAndCache(
    platform: Platform,
    fromPersistence: (insertedAfter: DayJs) => Future<Maybe<SummonerDb>>,
    fromApi: Future<Maybe<RiotSummoner>>,
    { forceCacheRefresh }: ForceCacheRefresh,
  ): Future<Maybe<Summoner>> {
    const insertedAfter = forceCacheRefresh
      ? Future.right(DayJs.of(0))
      : pipe(
          Future.fromIO(DayJs.now),
          Future.map(DayJs.subtract(constants.riotApi.cacheTtl.summoner)),
        )
    return pipe(
      insertedAfter,
      Future.chain(fromPersistence),
      futureMaybe.alt<Summoner>(() =>
        pipe(
          fromApi,
          futureMaybe.let('platform', () => platform),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(
            ({ id, puuid, name, profileIconId, summonerLevel, insertedAt }) =>
              summonerPersistence.upsert({
                id,
                puuid,
                platform,
                name,
                profileIconId,
                summonerLevel,
                insertedAt,
              }),
          ),
        ),
      ),
    )
  }
}

export { SummonerService }
