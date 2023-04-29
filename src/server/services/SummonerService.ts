import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { Maybe } from '../../shared/utils/fp'
import { Future, IO, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
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

type UseAccountApiKey = {
  useAccountApiKey: boolean
}

type SummonerService = ReturnType<typeof of>

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
        riotApiService.riotgames.platform(platform).lol.summonerV4.summoners.byName(summonerName),
        { forceCacheRefresh },
      ),

    findByPuuid: (
      platform: Platform,
      puuid: Puuid,
      {
        forceCacheRefresh,
        useAccountApiKey = false,
      }: ForceCacheRefresh & Partial<UseAccountApiKey> = { forceCacheRefresh: false },
    ): Future<Maybe<Summoner>> =>
      useAccountApiKey
        ? pipe(
            riotApiService.riotgames
              .platform(platform)
              .lol.summonerV4.summoners.byPuuid(puuid, { useAccountApiKey }),
            futureMaybe.map(s => ({ ...s, platform })),
          )
        : findAndCache(
            platform,
            insertedAfter => summonerPersistence.findByPuuid(puuid, insertedAfter),
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
            Future.map(DayJs.subtract(constants.riotApi.cacheTtl.summoner)),
            Future.chain(fromPersistence),
          ),
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
