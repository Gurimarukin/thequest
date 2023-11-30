import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { RiotId } from '../../shared/models/riot/RiotId'
import type { Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import { RiotAccount } from '../models/riot/RiotAccount'
import type { RiotAccountDb } from '../models/riot/RiotAccountDb'
import type { RiotRiotAccount } from '../models/riot/RiotRiotAccounts'
import type { RiotAccountPersistence } from '../persistence/RiotAccountPersistence'
import type { RiotApiService } from './RiotApiService'

type RiotAccountService = ReturnType<typeof RiotAccountService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function RiotAccountService(
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  riotAccountPersistence: RiotAccountPersistence,
  riotApiService: RiotApiService,
) {
  return {
    findByRiotId: (riotId: RiotId): Future<Maybe<RiotAccount>> => {
      const { gameName, tagLine } = riotId
      return findAndCache(
        insertedAfter => riotAccountPersistence.findByRiotId(riotId, insertedAfter),
        riotApiService.riotgames.regional.riot.accountV1.accounts.byRiotId(gameName)(tagLine),
      )
      // const { gameName, tagLine } = riotId
      // return pipe(
      //   Future.fromIO(DayJs.now),
      //   Future.map(DayJs.subtract(riotApiCacheTtl.account)),
      //   Future.chain(insertedAfter => riotAccountPersistence.findByRiotId(riotId, insertedAfter)),
      //   futureMaybe.alt<RiotAccount>(() =>
      //     pipe(
      //       riotApiService.riotgames.regional.riot.accountV1.accounts.byRiotId(gameName)(tagLine),
      //       futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
      //       futureMaybe.chainFirstTaskEitherK(riotAccountPersistence.upsert),
      //     ),
      //   ),
      // )
    },

    findByPuuid: (puuid: Puuid): Future<Maybe<RiotAccount>> =>
      findAndCache(
        insertedAfter => riotAccountPersistence.findByPuuid(puuid, insertedAfter),
        riotApiService.riotgames.regional.riot.accountV1.accounts.byPuuid(puuid),
      ),
  }

  /**
   * If `fromPersistence` is not found (taking cache ttl into account), call `fromApi` and persist result
   */
  function findAndCache(
    fromPersistence: (insertedAfter: DayJs) => Future<Maybe<RiotAccountDb>>,
    fromApi: Future<Maybe<RiotRiotAccount>>,
  ): Future<Maybe<RiotAccount>> {
    return pipe(
      Future.fromIO(DayJs.now),
      Future.map(DayJs.subtract(riotApiCacheTtl.summoner)),
      Future.chain(fromPersistence),
      futureMaybe.alt<RiotAccount>(() =>
        pipe(
          fromApi,
          futureMaybe.map(RiotAccount.fromApi),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(riotAccountPersistence.upsert),
        ),
      ),
    )
  }
}

export { RiotAccountService }
