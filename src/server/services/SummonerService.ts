import { flow, pipe } from 'fp-ts/function'

import type { Platform } from '../../shared/models/api/Platform'
import { DayJs } from '../../shared/models/DayJs'
import type { Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { Puuid } from '../models/riot/Puuid'
import type { RiotSummoner } from '../models/riot/RiotSummoner'
import type { Summoner } from '../models/summoner/Summoner'
import type { SummonerDb } from '../models/summoner/SummonerDb'
import type { SummonerPersistence } from '../persistence/SummonerPersistence'
import type { RiotApiService } from './RiotApiService'

// TODO: cron job to remove old summoners

type SummonerService = ReturnType<typeof SummonerService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerService = (
  riotApiService: RiotApiService,
  summonerPersistence: SummonerPersistence,
) => {
  return {
    findByName: (platform: Platform, summonerName: string): Future<Maybe<Summoner>> =>
      findAndCache(
        platform,
        insertedAfter => summonerPersistence.findByName(platform, summonerName, insertedAfter),
        riotApiService.lol.summoner.byName(platform, summonerName),
      ),

    findByPuuid: (platform: Platform, encryptedPUUID: Puuid): Future<Maybe<Summoner>> =>
      findAndCache(
        platform,
        insertedAfter => summonerPersistence.findByPuiid(platform, encryptedPUUID, insertedAfter),
        riotApiService.lol.summoner.byPuuid(platform, encryptedPUUID),
      ),
  }

  function findAndCache(
    platform: Platform,
    fromPersistence: (insertedAfter: DayJs) => Future<Maybe<SummonerDb>>,
    fromApi: Future<Maybe<RiotSummoner>>,
  ): Future<Maybe<Summoner>> {
    return pipe(
      DayJs.now,
      Future.fromIO,
      Future.chain(flow(DayJs.subtract(constants.riotApi.cache.summonerTtl), fromPersistence)),
      futureMaybe.alt<Summoner>(() =>
        pipe(
          fromApi,
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(
            ({ id, puuid, name, profileIconId, summonerLevel, insertedAt }) =>
              summonerPersistence.upsert({
                platform,
                id,
                puuid,
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
