import { pipe } from 'fp-ts/function'

import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import type { Dict, Future, Maybe } from '../../shared/utils/fp'
import { List, NonEmptyArray } from '../../shared/utils/fp'

import type { RiotConfig } from '../config/Config'
import type { HttpClient } from '../helpers/HttpClient'
import { statusesToOption } from '../helpers/HttpClient'
import { ActiveShards } from '../models/riot/ActiveShard'
import type { Game } from '../models/riot/Game'
import { RiotAccount } from '../models/riot/RiotAccount'
import { RiotChampionMastery } from '../models/riot/RiotChampionMastery'
import { RiotSummoner } from '../models/riot/RiotSummoner'
import { TagLine } from '../models/riot/TagLine'
import { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import { SummonerId } from '../models/summoner/SummonerId'

const { ddragon, ddragonCdn } = DDragonUtils

const xRiotToken = 'X-Riot-Token'

const regionalUrl = (path: string): string => `https://europe.api.riotgames.com${path}`

const plateformEndpoint: Dict<Platform, string> = {
  BR: 'br1.api.riotgames.com',
  EUN: 'eun1.api.riotgames.com',
  EUW: 'euw1.api.riotgames.com',
  JP: 'jp1.api.riotgames.com',
  KR: 'kr.api.riotgames.com',
  LA1: 'la1.api.riotgames.com',
  LA2: 'la2.api.riotgames.com',
  NA: 'na1.api.riotgames.com',
  OC: 'oc1.api.riotgames.com',
  TR: 'tr1.api.riotgames.com',
  RU: 'ru.api.riotgames.com',
}

const platformUrl = (platform: Platform, path: string): string =>
  `https://${plateformEndpoint[platform]}${path}`

type UseAccountApiKey = {
  useAccountApiKey: boolean
}

type RiotApiService = ReturnType<typeof RiotApiService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotApiService = (config: RiotConfig, httpClient: HttpClient) => {
  const leagueoflegendsDDragonApiVersions: Future<NonEmptyArray<DDragonVersion>> = httpClient.http(
    [ddragon('/api/versions.json'), 'get'],
    {},
    [NonEmptyArray.decoder(DDragonVersion.codec), 'NonEmptyArray<DDragonVersion>'],
  )

  return {
    leagueoflegends: {
      ddragon: {
        api: {
          versions: leagueoflegendsDDragonApiVersions,
        },

        cdn: (version: DDragonVersion) => ({
          data: (lang: Lang) => {
            const champion: Future<DDragonChampions> = httpClient.http(
              [ddragonCdn(version, `/data/${lang}/champion.json`), 'get'],
              {},
              [DDragonChampions.decoder, 'DDragonChampions'],
            )
            return { champion }
          },
        }),
      },
    },

    riotgames: {
      platform: (platform: Platform) => ({
        lol: {
          summonerV4: {
            summoners: {
              byName: (summonerName: string): Future<Maybe<RiotSummoner>> =>
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

              byPuuid: (
                puuid: Puuid,
                { useAccountApiKey }: UseAccountApiKey = { useAccountApiKey: false },
              ): Future<Maybe<RiotSummoner>> =>
                pipe(
                  httpClient.http(
                    [
                      platformUrl(
                        platform,
                        `/lol/summoner/v4/summoners/by-puuid/${Puuid.unwrap(puuid)}`,
                      ),
                      'get',
                    ],
                    {
                      headers: {
                        [xRiotToken]: useAccountApiKey ? config.accountApiKey : config.lolApiKey,
                      },
                    },
                    [RiotSummoner.decoder, 'RiotSummoner'],
                  ),
                  statusesToOption(404),
                ),

              /**
               * ⚠️  Consistently looking up summoner ids that don't exist will result in a blacklist.
               * @deprecated
               */
              // eslint-disable-next-line deprecation/deprecation
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

          championMasteryV4: {
            championMasteries: {
              bySummoner: (summonerId: SummonerId): Future<Maybe<List<RiotChampionMastery>>> =>
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
      }),

      regional: {
        riot: {
          accountV1: {
            accounts: {
              byRiotId:
                (gameName: string) =>
                (tagLine: TagLine): Future<Maybe<RiotAccount>> =>
                  pipe(
                    httpClient.http(
                      [
                        regionalUrl(
                          `/riot/account/v1/accounts/by-riot-id/${gameName}/${TagLine.unwrap(
                            tagLine,
                          )}`,
                        ),
                        'get',
                      ],
                      { headers: { [xRiotToken]: config.accountApiKey } },
                      [RiotAccount.decoder, 'Account'],
                    ),
                    statusesToOption(404),
                  ),
            },

            activeShards: {
              byGame: (game: Game) => ({
                byPuuid: (puuid: Puuid): Future<Maybe<ActiveShards>> =>
                  pipe(
                    httpClient.http(
                      [
                        regionalUrl(
                          `/riot/account/v1/active-shards/by-game/${game}/by-puuid/${Puuid.unwrap(
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
    },
  }
}

export { RiotApiService }
