import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { List, Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { ChampionMasteryPersistence } from '../persistence/ChampionMasteryPersistence'
import type { RiotApiService } from './RiotApiService'

type ForceCacheRefresh = {
  forceCacheRefresh: boolean
}

type MasteriesService = ReturnType<typeof MasteriesService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MasteriesService = (
  championMasteryPersistence: ChampionMasteryPersistence,
  riotApiService: RiotApiService,
) => ({
  findBySummoner: (
    platform: Platform,
    summonerId: SummonerId,
    { forceCacheRefresh }: ForceCacheRefresh = { forceCacheRefresh: false },
  ): Future<Maybe<List<ChampionMastery>>> => {
    const futureInsertedAfter = forceCacheRefresh
      ? Future.right(DayJs.of(0))
      : pipe(
          Future.fromIO(DayJs.now),
          Future.map(DayJs.subtract(constants.riotApi.cacheTtl.masteries)),
        )
    return pipe(
      futureInsertedAfter,
      Future.chain(insertedAfter =>
        championMasteryPersistence.findBySummoner(summonerId, insertedAfter),
      ),
      futureMaybe.map(m => m.champions),
      futureMaybe.alt<List<ChampionMastery>>(() =>
        pipe(
          riotApiService.riotgames
            .platform(platform)
            .lol.championMasteryV4.championMasteries.bySummoner(summonerId),
          futureMaybe.bindTo('champions'),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(({ champions, insertedAt }) =>
            championMasteryPersistence.upsert({ summonerId, champions, insertedAt }),
          ),
          futureMaybe.map(({ champions }) => champions),
        ),
      ),
    )
  },
})

export { MasteriesService }
