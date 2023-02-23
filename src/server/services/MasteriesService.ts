import { flow, pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { SummonerId } from '../../shared/models/api/summoner/SummonerId'
import type { List, Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import type { ChampionMasteryPersistence } from '../persistence/ChampionMasteryPersistence'
import type { RiotApiService } from './RiotApiService'

type MasteriesService = Readonly<ReturnType<typeof MasteriesService>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MasteriesService = (
  championMasteryPersistence: ChampionMasteryPersistence,
  riotApiService: RiotApiService,
) => ({
  findBySummoner: (
    platform: Platform,
    summonerId: SummonerId,
  ): Future<Maybe<List<ChampionMastery>>> =>
    pipe(
      DayJs.now,
      Future.fromIO,
      Future.chain(
        flow(DayJs.subtract(constants.riotApi.cache.masteriesTtl), insertedAfter =>
          championMasteryPersistence.findBySummoner(platform, summonerId, insertedAfter),
        ),
      ),
      futureMaybe.map(m => m.champions),
      futureMaybe.alt<List<ChampionMastery>>(() =>
        pipe(
          riotApiService.lol.championMasteryBySummoner(platform, summonerId),
          futureMaybe.bindTo('champions'),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(({ champions, insertedAt }) =>
            championMasteryPersistence.upsert({ platform, summonerId, champions, insertedAt }),
          ),
          futureMaybe.map(({ champions }) => champions),
        ),
      ),
    ),
})

export { MasteriesService }
