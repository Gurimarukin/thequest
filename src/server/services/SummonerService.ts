import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { SummonerName } from '../../shared/models/riot/SummonerName'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { Maybe } from '../../shared/utils/fp'
import { Future, IO, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { RiotSummoner } from '../models/riot/RiotSummoner'
import type { Summoner } from '../models/summoner/Summoner'
import type { SummonerDb } from '../models/summoner/SummonerDb'
import type { SummonerPersistence } from '../persistence/SummonerPersistence'
import { getOnError } from '../utils/getOnError'
import type { RiotApiService } from './RiotApiService'

type ForceCacheRefresh = {
  forceCacheRefresh: boolean
}

type SummonerService = ReturnType<typeof of>

const SummonerService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  Logger: LoggerGetter,
  summonerPersistence: SummonerPersistence,
  riotApiService: RiotApiService,
  cronJobObservable: TObservable<CronJobEvent>,
): IO<SummonerService> => {
  const logger = Logger('SummonerService')

  return pipe(
    cronJobObservable,
    TObservable.subscribe(getOnError(logger))({
      next: ({ date }) =>
        pipe(
          summonerPersistence.deleteBeforeDate(
            pipe(date, DayJs.subtract(riotApiCacheTtl.summoner)),
          ),
          Future.map(toNotUsed),
        ),
    }),
    IO.map(() => of(riotApiCacheTtl, summonerPersistence, riotApiService)),
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  summonerPersistence: SummonerPersistence,
  riotApiService: RiotApiService,
) => {
  return {
    findByName: (
      platform: Platform,
      name: SummonerName,
      { forceCacheRefresh }: ForceCacheRefresh = { forceCacheRefresh: false },
    ): Future<Maybe<Summoner>> =>
      findAndCache(
        platform,
        // eslint-disable-next-line deprecation/deprecation
        insertedAfter => summonerPersistence.findByName(platform, name, insertedAfter),
        // eslint-disable-next-line deprecation/deprecation
        riotApiService.riotgames.platform(platform).lol.summonerV4.summoners.byName(name),
        { forceCacheRefresh },
      ),

    findByPuuid: (
      platform: Platform,
      puuid: Puuid,
      { forceCacheRefresh }: ForceCacheRefresh = { forceCacheRefresh: false },
    ): Future<Maybe<Summoner>> =>
      findAndCache(
        platform,
        insertedAfter => summonerPersistence.findByPuuid(platform, puuid, insertedAfter),
        riotApiService.riotgames.platform(platform).lol.summonerV4.summoners.byPuuid(puuid),
        { forceCacheRefresh },
      ),

    deleteByPuuid: summonerPersistence.deleteByPuuid,
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
    return pipe(
      forceCacheRefresh
        ? futureMaybe.none
        : pipe(
            Future.fromIO(DayJs.now),
            Future.map(DayJs.subtract(riotApiCacheTtl.summoner)),
            Future.chain(fromPersistence),
          ),
      futureMaybe.alt<Summoner>(() =>
        pipe(
          fromApi,
          futureMaybe.let('platform', () => platform),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(summonerPersistence.upsert),
        ),
      ),
    )
  }
}

export { SummonerService }
