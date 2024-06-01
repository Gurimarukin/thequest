import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { Maybe } from '../../shared/utils/fp'
import { Future, List } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import type { ChampionMasteries } from '../models/championMastery/ChampionMasteries'
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
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

const MasteriesService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  championMasteryPersistence: ChampionMasteryPersistence,
  riotApiService: RiotApiService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => ({
  findBySummoner: (
    platform: Platform,
    puuid: Puuid,
    { forceCacheRefresh = false, overrideInsertedAfter }: FindOptions = {},
  ): Future<Maybe<ChampionMasteries>> =>
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
              championMasteryPersistence.findByPuuid(puuid, insertedAfter),
            ),
          ),
      futureMaybe.alt<Omit<ChampionMasteries, 'cacheDuration'>>(() =>
        pipe(
          riotApiService.riotgames
            .platform(platform)
            .lol.championMasteryV4.championMasteries.byPuuid(puuid),
          futureMaybe.bindTo('champions'),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(({ champions, insertedAt }) =>
            championMasteryPersistence.upsert({ puuid, champions, insertedAt }),
          ),
        ),
      ),
      futureMaybe.map(
        (s): ChampionMasteries => ({ ...s, cacheDuration: riotApiCacheTtl.masteries }),
      ),
      futureMaybe.map(masteries => ({
        ...masteries,
        champions: pipe(masteries.champions, List.map(fixPointsSinceLastLevel)),
      })),
    ),
})

export { MasteriesService }

const pointsRequiredForLevel6 = 31600
const pointsRequiredForLevel7 = 42600

function fixPointsSinceLastLevel(c: ChampionMastery): ChampionMastery {
  if (c.championLevel === 6) {
    if (pointsRequiredForLevel6 <= c.championPoints) return c

    return {
      ...c,
      championPointsSinceLastLevel: c.championPoints - pointsRequiredForLevel6,
    }
  }

  if (c.championLevel === 7) {
    if (pointsRequiredForLevel7 <= c.championPoints) return c

    return {
      ...c,
      championPointsSinceLastLevel: c.championPoints - pointsRequiredForLevel7,
    }
  }

  return c
}
