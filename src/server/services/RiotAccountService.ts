import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { Puuid } from '../models/riot/Puuid'
import { Shard } from '../models/riot/Shard'
import type { TagLine } from '../models/riot/TagLine'
import type { RiotAccountPersistence } from '../persistence/RiotAccountPersistence'
import type { RiotApiService } from './RiotApiService'

type PlatformWithPuuid = {
  readonly platform: Platform
  readonly puuid: Puuid
}

type RiotAccountService = Readonly<ReturnType<typeof RiotAccountService>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotAccountService = (
  riotAccountPersistence: RiotAccountPersistence,
  riotApiService: RiotApiService,
) => ({
  findByGameNameAndTagLine: (
    gameName: string,
    tagLine: TagLine,
  ): Future<Maybe<PlatformWithPuuid>> =>
    pipe(
      Future.fromIO(DayJs.now),
      Future.map(DayJs.subtract(constants.riotApi.cacheTtl.account)),
      Future.chain(insertedAfter =>
        riotAccountPersistence.findByGameNameAndTagLine(gameName, tagLine, insertedAfter),
      ),
      futureMaybe.map(a => ({ platform: a.platform, puuid: a.puuid })),
      futureMaybe.alt<PlatformWithPuuid>(() =>
        pipe(
          riotApiService.riotgames.regional.riot.accountV1.accounts.byRiotId(gameName)(tagLine),
          futureMaybe.chain(({ puuid }) =>
            riotApiService.riotgames.regional.riot.accountV1.activeShards
              .byGame('lor')
              .byPuuid(puuid),
          ),
          futureMaybe.bindTo('account'),
          futureMaybe.let('platform', ({ account }) => Shard.platform[account.activeShard]),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(({ account: { puuid }, platform, insertedAt }) =>
            riotAccountPersistence.upsert({ gameName, tagLine, platform, puuid, insertedAt }),
          ),
          futureMaybe.map(({ account: { puuid }, platform }) => ({ platform, puuid })),
        ),
      ),
    ),
})

export { RiotAccountService }
