import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { List, Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { ChampionMasteryPersistence } from '../persistence/ChampionMasteryPersistence'
import type { RiotApiService } from './RiotApiService'

type FindOptions = {
  /**
   * Forces cache refreshing (ignores cached value)
   */
  forceCacheRefresh?: boolean
  /**
   * Keep values cached after this date. No effect if forceCacheRefresh === true
   * @default now - constants.riotApiCacheTtl.masteries
   */
  overrideInsertedAfter?: DayJs
}

type MasteriesService = ReturnType<typeof MasteriesService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MasteriesService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  championMasteryPersistence: ChampionMasteryPersistence,
  riotApiService: RiotApiService,
) => ({
  findBySummoner: (
    platform: Platform,
    summonerId: SummonerId,
    { forceCacheRefresh = false, overrideInsertedAfter }: FindOptions = {},
  ): Future<Maybe<List<ChampionMastery>>> =>
    pipe(
      forceCacheRefresh
        ? futureMaybe.none
        : pipe(
            overrideInsertedAfter !== undefined
              ? Future.successful(overrideInsertedAfter)
              : pipe(
                  Future.fromIO(DayJs.now),
                  Future.map(DayJs.subtract(riotApiCacheTtl.masteries)),
                ),
            Future.chain(insertedAfter =>
              championMasteryPersistence.findBySummoner(summonerId, insertedAfter),
            ),
            futureMaybe.map(m => m.champions),
          ),
      futureMaybe.alt<List<ChampionMastery>>(() =>
        pipe(
          riotApiService.riotgames
            .platform(platform)
            .lol.championMasteryV4.championMasteries.bySummoner(summonerId),
          futureMaybe.chainFirstTaskEitherK(champions =>
            pipe(
              Future.fromIO(DayJs.now),
              Future.chain(insertedAt =>
                championMasteryPersistence.upsert({ summonerId, champions, insertedAt }),
              ),
            ),
          ),
        ),
      ),
    ),
})

export { MasteriesService }
