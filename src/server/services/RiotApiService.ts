import { pipe } from 'fp-ts/function'

import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { GameId } from '../../shared/models/api/GameId'
import type { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { GameName } from '../../shared/models/riot/GameName'
import type { TagLine } from '../../shared/models/riot/TagLine'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import type { Dict, Future, Maybe } from '../../shared/utils/fp'
import { List, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { Config } from '../config/Config'
import type { HttpClient } from '../helpers/HttpClient'
import { statusesToOption } from '../helpers/HttpClient'
import { RiotChallenges } from '../models/riot/RiotChallenges'
import { RiotChampionMastery } from '../models/riot/RiotChampionMastery'
import { RiotLeagueEntry } from '../models/riot/RiotLeagueEntry'
import { RiotRiotAccount } from '../models/riot/RiotRiotAccounts'
import { RiotSummoner } from '../models/riot/RiotSummoner'
import { RiotCurrentGameInfo } from '../models/riot/currentGame/RiotCurrentGameInfo'
import { CDragonRune } from '../models/riot/ddragon/CDragonRune'
import { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import { DDragonRuneStyle } from '../models/riot/ddragon/DDragonRuneStyle'
import { DDragonSummoners } from '../models/riot/ddragon/DDragonSummoners'
import { RiotMatch } from '../models/riot/match/RiotMatch'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { MockService } from './MockService'

const { ddragon, ddragonCdn } = DDragonUtils

const xRiotToken = 'X-Riot-Token'

function regionalUrl(region: Region, path: string): string {
  return `https://${region.toLowerCase()}.api.riotgames.com${path}`
}

type Region = (typeof regionValues)[number]

const regionValues = ['AMERICAS', 'ASIA', 'EUROPE', 'SEA'] as const

/**
 * The AMERICAS routing value serves NA, BR, LAN and LAS.
 * The ASIA routing value serves KR and JP.
 * The EUROPE routing value serves EUNE, EUW, TR and RU.
 * The SEA routing value serves OCE, PH2, SG2, TH2, TW2 and VN2.
 */
const platformRegion: Dict<Platform, Region> = {
  BR: 'AMERICAS',
  EUN: 'EUROPE',
  EUW: 'EUROPE',
  JP: 'ASIA',
  KR: 'ASIA',
  LA1: 'AMERICAS',
  LA2: 'AMERICAS',
  NA: 'AMERICAS',
  OC: 'SEA',
  TR: 'EUROPE',
  RU: 'EUROPE',
  PH2: 'SEA',
  SG2: 'SEA',
  TH2: 'SEA',
  TW2: 'SEA',
  VN2: 'SEA',
}

function platformUrl(platform: Platform, path: string): string {
  return `https://${platformCode[platform].toLowerCase()}.api.riotgames.com${path}`
}

const platformCode: Dict<Platform, string> = {
  BR: 'BR1',
  EUN: 'EUN1',
  EUW: 'EUW1',
  JP: 'JP1',
  KR: 'KR',
  LA1: 'LA1',
  LA2: 'LA2',
  NA: 'NA1',
  OC: 'OC1',
  TR: 'TR1',
  RU: 'RU',
  PH2: 'PH2',
  SG2: 'SG2',
  TH2: 'TH2',
  TW2: 'TW2',
  VN2: 'VN2',
}

type RiotApiService = ReturnType<typeof RiotApiService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotApiService = (config: Config, httpClient: HttpClient, mockService: MockService) => {
  const lolKey = config.riotApi.key

  const leagueoflegendsDDragonApiVersions: Future<NonEmptyArray<DDragonVersion>> = httpClient.json(
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
            const champion: Future<DDragonChampions> = httpClient.json(
              [ddragonCdn(version, `/data/${lang}/champion.json`), 'get'],
              {},
              [DDragonChampions.decoder, 'DDragonChampions'],
            )

            const summoner: Future<DDragonSummoners> = httpClient.json(
              [ddragonCdn(version, `/data/${lang}/summoner.json`), 'get'],
              {},
              [DDragonSummoners.decoder, 'DDragonSummoners'],
            )

            const runesReforged: Future<List<DDragonRuneStyle>> = httpClient.json(
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
              byPuuid: (puuid: Puuid): Future<Maybe<List<RiotChampionMastery>>> =>
                pipe(
                  httpClient.json(
                    [
                      platformUrl(
                        platform,
                        `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
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
                httpClient.json(
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
                  httpClient.json(
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

          spectatorV5: {
            activeGames: {
              bySummoner: (puuid: Puuid): Future<Maybe<RiotCurrentGameInfo>> =>
                pipe(
                  config.mock ? mockService.activeGames.bySummoner(puuid) : futureMaybe.none,
                  futureMaybe.alt(() =>
                    pipe(
                      httpClient.json(
                        [
                          platformUrl(
                            platform,
                            `/lol/spectator/v5/active-games/by-summoner/${puuid}`,
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
              /** @deprecated ⚠️ Consistently looking up summoner ids that don't exist will result in a blacklist. */
              // eslint-disable-next-line deprecation/deprecation
              byId: (summonerId: SummonerId): Future<Maybe<RiotSummoner>> =>
                pipe(
                  httpClient.json(
                    [platformUrl(platform, `/lol/summoner/v4/summoners/${summonerId}`), 'get'],
                    { headers: { [xRiotToken]: lolKey } },
                    [RiotSummoner.decoder, 'RiotSummoner'],
                  ),
                  statusesToOption(404),
                ),

              byPuuid: (puuid: Puuid): Future<Maybe<RiotSummoner>> =>
                pipe(
                  httpClient.json(
                    [platformUrl(platform, `/lol/summoner/v4/summoners/by-puuid/${puuid}`), 'get'],
                    {
                      headers: { [xRiotToken]: lolKey },
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
        lol: {
          matchV5: {
            matches: (platform: Platform, gameId: GameId): Future<Maybe<RiotMatch>> =>
              pipe(
                httpClient.json(
                  [
                    regionalUrl(
                      platformRegion[platform],
                      `/lol/match/v5/matches/${platformCode[platform]}_${gameId}`,
                    ),
                    'get',
                  ],
                  { headers: { [xRiotToken]: lolKey } },
                  [RiotMatch.decoder, 'RiotMatch'],
                ),
                statusesToOption(404),
              ),
          },
        },
        riot: {
          accountV1: {
            accounts: {
              byRiotId:
                (gameName: GameName) =>
                (tagLine: TagLine): Future<Maybe<RiotRiotAccount>> =>
                  pipe(
                    httpClient.json(
                      [
                        regionalUrl(
                          'EUROPE',
                          `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
                        ),
                        'get',
                      ],
                      { headers: { [xRiotToken]: lolKey } },
                      [RiotRiotAccount.decoder, 'RiotRiotAccount'],
                    ),
                    statusesToOption(404),
                  ),

              byPuuid: (puuid: Puuid): Future<Maybe<RiotRiotAccount>> =>
                pipe(
                  httpClient.json(
                    [regionalUrl('EUROPE', `/riot/account/v1/accounts/by-puuid/${puuid}`), 'get'],
                    { headers: { [xRiotToken]: lolKey } },
                    [RiotRiotAccount.decoder, 'RiotRiotAccount'],
                  ),
                  statusesToOption(404),
                ),
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
              const perks: Future<List<CDragonRune>> = httpClient.json(
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
