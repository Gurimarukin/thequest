import { pipe } from 'fp-ts/function'

import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { GameName } from '../../shared/models/riot/GameName'
import type { SummonerName } from '../../shared/models/riot/SummonerName'
import type { TagLine } from '../../shared/models/riot/TagLine'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import type { Dict, Future, Maybe } from '../../shared/utils/fp'
import { List, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { Config } from '../config/Config'
import type { HttpClient } from '../helpers/HttpClient'
import { statusesToOption } from '../helpers/HttpClient'
import { ActiveShards } from '../models/riot/ActiveShard'
import type { Game } from '../models/riot/Game'
import { RiotAccount } from '../models/riot/RiotAccount'
import { RiotChallenges } from '../models/riot/RiotChallenges'
import { RiotChampionMastery } from '../models/riot/RiotChampionMastery'
import { RiotLeagueEntry } from '../models/riot/RiotLeagueEntry'
import { RiotSummoner } from '../models/riot/RiotSummoner'
import { RiotCurrentGameInfo } from '../models/riot/currentGame/RiotCurrentGameInfo'
import { CDragonRune } from '../models/riot/ddragon/CDragonRune'
import { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import { DDragonRuneStyle } from '../models/riot/ddragon/DDragonRuneStyle'
import { DDragonSummoners } from '../models/riot/ddragon/DDragonSummoners'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { MockService } from './MockService'

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
const RiotApiService = (config: Config, httpClient: HttpClient, mockService: MockService) => {
  const { lol: lolKey, account: accountKey } = config.riotApi.keys

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

            const summoner: Future<DDragonSummoners> = httpClient.http(
              [ddragonCdn(version, `/data/${lang}/summoner.json`), 'get'],
              {},
              [DDragonSummoners.decoder, 'DDragonSummoners'],
            )

            const runesReforged: Future<List<DDragonRuneStyle>> = httpClient.http(
              [ddragonCdn(version, `/data/${lang}/runesReforged.json`), 'get'],
              {},
              [List.decoder(DDragonRuneStyle.decoder), 'List<DDragonRuneStyle>'],
            )

            return { champion, summoner, runesReforged }
          },
        }),
      },
    },

    riotgames: {
      platform: (platform: Platform) => ({
        lol: {
          championMasteryV4: {
            championMasteries: {
              bySummoner: (summonerId: SummonerId): Future<Maybe<List<RiotChampionMastery>>> =>
                pipe(
                  httpClient.http(
                    [
                      platformUrl(
                        platform,
                        `/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`,
                      ),
                      'get',
                    ],
                    { headers: { [xRiotToken]: lolKey } },
                    [List.decoder(RiotChampionMastery.decoder), 'List<RiotChampionMastery>'],
                  ),
                  statusesToOption(404),
                ),
            },
          },

          challengesV1: {
            playerData: (puuid: Puuid): Future<Maybe<RiotChallenges>> =>
              pipe(
                httpClient.http(
                  [platformUrl(platform, `/lol/challenges/v1/player-data/${puuid}`), 'get'],
                  { headers: { [xRiotToken]: lolKey } },
                  [RiotChallenges.decoder, 'RiotChallenges'],
                ),
                statusesToOption(404),
              ),
          },

          leagueV4: {
            entries: {
              bySummoner: (summonerId: SummonerId): Future<Maybe<List<RiotLeagueEntry>>> =>
                pipe(
                  httpClient.http(
                    [
                      platformUrl(platform, `/lol/league/v4/entries/by-summoner/${summonerId}`),
                      'get',
                    ],
                    { headers: { [xRiotToken]: lolKey } },
                    [List.decoder(RiotLeagueEntry.decoder), 'List<RiotLeagueEntry>'],
                  ),
                  statusesToOption(404),
                ),
            },
          },

          spectatorV4: {
            activeGames: {
              bySummoner: (summonerId: SummonerId): Future<Maybe<RiotCurrentGameInfo>> =>
                pipe(
                  config.mock ? mockService.activeGames.bySummoner(summonerId) : futureMaybe.none,
                  futureMaybe.alt(() =>
                    pipe(
                      httpClient.http(
                        [
                          platformUrl(
                            platform,
                            `/lol/spectator/v4/active-games/by-summoner/${summonerId}`,
                          ),
                          'get',
                        ],
                        { headers: { [xRiotToken]: lolKey } },
                        [RiotCurrentGameInfo.decoder, 'RiotCurrentGameInfo'],
                      ),
                      statusesToOption(404),
                    ),
                  ),
                ),
            },
          },

          summonerV4: {
            summoners: {
              /**
               * ⚠️  Consistently looking up summoner ids that don't exist will result in a blacklist.
               * @deprecated
               */
              // eslint-disable-next-line deprecation/deprecation
              byId: (summonerId: SummonerId): Future<Maybe<RiotSummoner>> =>
                pipe(
                  httpClient.http(
                    [platformUrl(platform, `/lol/summoner/v4/summoners/${summonerId}`), 'get'],
                    { headers: { [xRiotToken]: lolKey } },
                    [RiotSummoner.decoder, 'RiotSummoner'],
                  ),
                  statusesToOption(404),
                ),

              byName: (summonerName: SummonerName): Future<Maybe<RiotSummoner>> =>
                pipe(
                  httpClient.http(
                    [
                      platformUrl(platform, `/lol/summoner/v4/summoners/by-name/${summonerName}`),
                      'get',
                    ],
                    { headers: { [xRiotToken]: lolKey } },
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
                    [platformUrl(platform, `/lol/summoner/v4/summoners/by-puuid/${puuid}`), 'get'],
                    {
                      headers: { [xRiotToken]: useAccountApiKey ? accountKey : lolKey },
                    },
                    [RiotSummoner.decoder, 'RiotSummoner'],
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
                (gameName: GameName) =>
                (tagLine: TagLine): Future<Maybe<RiotAccount>> =>
                  pipe(
                    httpClient.http(
                      [
                        regionalUrl(`/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`),
                        'get',
                      ],
                      { headers: { [xRiotToken]: accountKey } },
                      [RiotAccount.decoder, 'RiotAccount'],
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
                          `/riot/account/v1/active-shards/by-game/${game}/by-puuid/${puuid}`,
                        ),
                        'get',
                      ],
                      { headers: { [xRiotToken]: accountKey } },
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

    communitydragon: {
      latest: {
        plugins: {
          rcpBeLolGameData: {
            global: (lang: Lang) => {
              const perks: Future<List<CDragonRune>> = httpClient.http(
                [
                  `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${lang.toLowerCase()}/v1/perks.json`,
                  'get',
                ],
                {},
                [List.decoder(CDragonRune.decoder), 'List<CDragonRune>'],
              )
              return {
                v1: { perks },
              }
            },
          },
        },
      },
    },
  }
}

export { RiotApiService }
