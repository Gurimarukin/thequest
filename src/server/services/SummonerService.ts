import { ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { TObservable } from '../../shared/models/rx/TObservable'
import { Future, IO, Maybe, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
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

const of = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  summonerPersistence: SummonerPersistence,
  riotApiService: RiotApiService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return {
    findByPuuid: (
      platform: Platform,
      puuid: Puuid,
      { forceCacheRefresh }: ForceCacheRefresh = { forceCacheRefresh: false },
    ): Future<Maybe<Summoner>> =>
      pipe(
        summonerPersistence.findByPuuid(platform, puuid),
        Future.flatMap(
          Maybe.fold(
            () => fetchByPuuidAndInsert(platform, puuid),
            summoner =>
              pipe(
                Future.fromIO(DayJs.now),
                Future.map(DayJs.subtract(riotApiCacheTtl.summoner)),
                Future.chain(insertedAfter =>
                  forceCacheRefresh || ord.lt(DayJs.Ord)(summoner.insertedAt, insertedAfter)
                    ? fetchByPuuidAndUpdate(platform, puuid, summoner)
                    : futureMaybe.some(summoner),
                ),
              ),
          ),
        ),
      ),

    deleteByPuuid: summonerPersistence.deleteByPuuid,
  }

  function fetchByPuuidAndInsert(platform: Platform, puuid: Puuid): Future<Maybe<Summoner>> {
    return pipe(
      riotApiService.riotgames.platform(platform).lol.summonerV4.summoners.byPuuid(puuid),
      futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
      futureMaybe.map((s): SummonerDb => ({ ...s, platform, name: Maybe.none })),
      futureMaybe.chainFirstTaskEitherK(summonerPersistence.insert),
    )
  }

  function fetchByPuuidAndUpdate(
    platform: Platform,
    puuid: Puuid,
    previous: SummonerDb,
  ): Future<Maybe<Summoner>> {
    return pipe(
      riotApiService.riotgames.platform(platform).lol.summonerV4.summoners.byPuuid(puuid),
      futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
      futureMaybe.map((s): SummonerDb => ({ ...s, platform, name: previous.name })),
      futureMaybe.chainFirstTaskEitherK(summonerPersistence.update),
    )
  }
}

export { SummonerService }
