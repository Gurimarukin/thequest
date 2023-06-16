import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import { Shard } from '../models/riot/Shard'
import type { TagLine } from '../models/riot/TagLine'
import type { RiotAccountPersistence } from '../persistence/RiotAccountPersistence'
import type { RiotApiService } from './RiotApiService'
import type { SummonerService } from './SummonerService'

type PlatformWithPuuid = {
  platform: Platform
  puuid: Puuid
  summonerCacheWasRefreshed: boolean
}

type ForceCacheRefresh = {
  forceCacheRefresh: boolean
}

type RiotAccountService = ReturnType<typeof RiotAccountService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotAccountService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  riotAccountPersistence: RiotAccountPersistence,
  riotApiService: RiotApiService,
  summonerService: SummonerService,
) => ({
  findByGameNameAndTagLine: (
    gameName: string,
    tagLine: TagLine,
    // should force cache refresh for summmoner (with lolApiKey encrypted puuid)
    { forceCacheRefresh }: ForceCacheRefresh,
  ): Future<Maybe<PlatformWithPuuid>> =>
    pipe(
      Future.fromIO(DayJs.now),
      Future.map(DayJs.subtract(riotApiCacheTtl.account)),
      Future.chain(insertedAfter =>
        riotAccountPersistence.findByGameNameAndTagLine(gameName, tagLine, insertedAfter),
      ),
      futureMaybe.map(a => ({
        platform: a.platform,
        puuid: a.puuid,
        summonerCacheWasRefreshed: false,
      })),
      futureMaybe.alt<PlatformWithPuuid>(() =>
        pipe(
          // this gives us puuid but encrypted with accountApiKey
          riotApiService.riotgames.regional.riot.accountV1.accounts.byRiotId(gameName)(tagLine),
          futureMaybe.map(a => a.puuid),
          futureMaybe.bindTo('accountApiKeyPuuid'),
          futureMaybe.bind('platform', ({ accountApiKeyPuuid }) =>
            // we need to pass a puuid encrypted with accountApiKey aswell
            pipe(
              riotApiService.riotgames.regional.riot.accountV1.activeShards
                .byGame('lor')
                .byPuuid(accountApiKeyPuuid),
              futureMaybe.map(a => Shard.platform[a.activeShard]),
            ),
          ),
          futureMaybe.bind('summonerName', ({ platform, accountApiKeyPuuid }) =>
            pipe(
              riotApiService.riotgames
                .platform(platform)
                .lol.summonerV4.summoners.byPuuid(accountApiKeyPuuid, { useAccountApiKey: true }),
              futureMaybe.map(s => s.name),
            ),
          ),
          // and finally get puuid but encrypted with lolApiKey
          futureMaybe.bind('lolApiKeyPuuid', ({ platform, summonerName }) =>
            pipe(
              summonerService.findByName(platform, summonerName, { forceCacheRefresh }),
              futureMaybe.map(s => s.puuid),
            ),
          ),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(({ platform, lolApiKeyPuuid, insertedAt }) =>
            riotAccountPersistence.upsert({
              gameName,
              tagLine,
              platform,
              puuid: lolApiKeyPuuid,
              insertedAt,
            }),
          ),
          futureMaybe.map(
            ({ platform, lolApiKeyPuuid }): PlatformWithPuuid => ({
              platform,
              puuid: lolApiKeyPuuid,
              summonerCacheWasRefreshed: true,
            }),
          ),
        ),
      ),
    ),
})

export { RiotAccountService }
