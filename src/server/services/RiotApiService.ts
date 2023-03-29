import { pipe } from 'fp-ts/function'

import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import type { Future, Maybe } from '../../shared/utils/fp'
import { List, NonEmptyArray } from '../../shared/utils/fp'

import type { RiotConfig } from '../config/Config'
import { constants } from '../config/constants'
import type { HttpClient } from '../helpers/HttpClient'
import { statusesToOption } from '../helpers/HttpClient'
import { Account } from '../models/riot/Account'
import { ActiveShards } from '../models/riot/ActiveShard'
import type { Game } from '../models/riot/Game'
import { Puuid } from '../models/riot/Puuid'
import { RiotChampionMastery } from '../models/riot/RiotChampionMastery'
import { RiotSummoner } from '../models/riot/RiotSummoner'
import { UnencryptedPuuid } from '../models/riot/UnencryptedPuuid'
import { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import { SummonerId } from '../models/summoner/SummonerId'

const { ddragon, ddragonCdn } = DDragonUtils

const xRiotToken = 'X-Riot-Token'

const regionalUrl = (path: string): string => `https://${constants.riotApi.regionalHost}${path}`

const platformUrl = (platform: Platform, path: string): string =>
  `https://${constants.riotApi.plateformEndpoint[platform]}${path}`

type RiotApiService = Readonly<ReturnType<typeof RiotApiService>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotApiService = (config: RiotConfig, httpClient: HttpClient) => ({
  com: {
    leagueoflegends: {
      ddragon: {
        api: {
          versions: httpClient.http([ddragon('/api/versions.json'), 'get'], {}, [
            NonEmptyArray.decoder(DDragonVersion.codec),
            'NonEmptyArray<DDragonVersion>',
          ]),
        },

        cdn: (version: DDragonVersion) => ({
          data: (lang: Lang) => ({
            champion: httpClient.http(
              [ddragonCdn(version, `/data/${lang}/champion.json`), 'get'],
              {},
              [DDragonChampions.decoder, 'DDragonChampions'],
            ),
          }),
        }),
      },
    },

    riotgame: {
      api: (platform: Platform) => ({
        lol: {
          summoner: {
            v4: {
              summoners: {
                byName: (summonerName: string) =>
                  pipe(
                    httpClient.http(
                      [
                        platformUrl(platform, `/lol/summoner/v4/summoners/by-name/${summonerName}`),
                        'get',
                      ],
                      { headers: { [xRiotToken]: config.lolApiKey } },
                      [RiotSummoner.decoder, 'RiotSummoner'],
                    ),
                    statusesToOption(404),
                  ),

                byPuuid: (puuid: Puuid) =>
                  pipe(
                    httpClient.http(
                      [
                        platformUrl(
                          platform,
                          `/lol/summoner/v4/summoners/by-puuid/${Puuid.unwrap(puuid)}`,
                        ),
                        'get',
                      ],
                      { headers: { [xRiotToken]: config.lolApiKey } },
                      [RiotSummoner.decoder, 'RiotSummoner'],
                    ),
                    statusesToOption(404),
                  ),

                /**
                 * ⚠️  Consistently looking up summoner ids that don't exist will result in a blacklist.
                 * @deprecated
                 */
                byId: (summonerId: SummonerId): Future<Maybe<RiotSummoner>> =>
                  pipe(
                    httpClient.http(
                      [
                        platformUrl(
                          platform,
                          `/lol/summoner/v4/summoners/${SummonerId.unwrap(summonerId)}`,
                        ),
                        'get',
                      ],
                      { headers: { [xRiotToken]: config.lolApiKey } },
                      [RiotSummoner.decoder, 'RiotSummoner'],
                    ),
                    statusesToOption(404),
                  ),
              },
            },
          },

          championMastery: {
            v4: {
              championMasteries: {
                bySummoner: (summonerId: SummonerId) =>
                  pipe(
                    httpClient.http(
                      [
                        platformUrl(
                          platform,
                          `/lol/champion-mastery/v4/champion-masteries/by-summoner/${SummonerId.unwrap(
                            summonerId,
                          )}`,
                        ),
                        'get',
                      ],
                      { headers: { [xRiotToken]: config.lolApiKey } },
                      [List.decoder(RiotChampionMastery.decoder), 'List<ChampionMastery>'],
                    ),
                    statusesToOption(404),
                  ),
              },
            },
          },
        },

        riot: {
          account: {
            v1: {
              accounts: {
                byRiotId:
                  (gameName: string) =>
                  (tagLine: string): Future<Maybe<Account>> =>
                    pipe(
                      httpClient.http(
                        [
                          regionalUrl(
                            `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
                          ),
                          'get',
                        ],
                        { headers: { [xRiotToken]: config.accountApiKey } },
                        [Account.decoder, 'Account'],
                      ),
                      statusesToOption(404),
                    ),
              },

              activeShards: {
                byGame: (game: Game) => ({
                  byPuuid: (puuid: UnencryptedPuuid) =>
                    pipe(
                      httpClient.http(
                        [
                          regionalUrl(
                            `/riot/account/v1/active-shards/by-game/${game}/by-puuid/${UnencryptedPuuid.unwrap(
                              puuid,
                            )}`,
                          ),
                          'get',
                        ],
                        { headers: { [xRiotToken]: config.accountApiKey } },
                        [ActiveShards.decoder, 'ActiveShards'],
                      ),
                      statusesToOption(404),
                    ),
                }),
              },
            },
          },
        },
      }),
    },
  },
})

export { RiotApiService }
