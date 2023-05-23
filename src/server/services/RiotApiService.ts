import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'

import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import type { Dict, Future, Tuple } from '../../shared/utils/fp'
import { Either, List, Maybe, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import type { RiotConfig } from '../config/Config'
import type { HttpClient } from '../helpers/HttpClient'
import { statusesToOption } from '../helpers/HttpClient'
import { ActiveShards } from '../models/riot/ActiveShard'
import type { Game } from '../models/riot/Game'
import { RiotAccount } from '../models/riot/RiotAccount'
import { RiotChampionMastery } from '../models/riot/RiotChampionMastery'
import { RiotLeagueEntry } from '../models/riot/RiotLeagueEntry'
import { RiotSummoner } from '../models/riot/RiotSummoner'
import type { TagLine } from '../models/riot/TagLine'
import { RiotCurrentGameInfo } from '../models/riot/currentGame/RiotCurrentGameInfo'
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
                    [platformUrl(platform, `/lol/summoner/v4/summoners/by-puuid/${puuid}`), 'get'],
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
                    [platformUrl(platform, `/lol/summoner/v4/summoners/${summonerId}`), 'get'],
                    { headers: { [xRiotToken]: config.lolApiKey } },
                    [RiotSummoner.decoder, 'RiotSummoner'],
                  ),
                  statusesToOption(404),
                ),
            },
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
                    { headers: { [xRiotToken]: config.lolApiKey } },
                    [List.decoder(RiotLeagueEntry.decoder), 'List<RiotLeagueEntry>'],
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
                        `/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`,
                      ),
                      'get',
                    ],
                    { headers: { [xRiotToken]: config.lolApiKey } },
                    [List.decoder(RiotChampionMastery.decoder), 'List<RiotChampionMastery>'],
                  ),
                  statusesToOption(404),
                ),
            },
          },

          spectatorV4: {
            activeGames: {
              bySummoner: (summonerId: SummonerId): Future<Maybe<RiotCurrentGameInfo>> =>
                staticData([RiotCurrentGameInfo.decoder, 'RiotCurrentGameInfo'])(
                  (id_: SummonerId) => {
                    const id = SummonerId.unwrap(id_)

                    // JeanMarieLeePong
                    if (id === 'mO7BRK1xihCSnaVHRbUgO_oXzJSxdeUF8j5RdJapNf4cVjM') {
                      return Maybe.some(aramGame)
                    }

                    // Elektrokiute
                    if (id === 'YAM8bQSkRGLieK4hjcEL3sZ-DRGOscHC2ASltF-EQHpKnZg') {
                      return Maybe.some(rankedGame)
                    }

                    return Maybe.none
                  },
                )(summonerId),
              // pipe(
              //   httpClient.http(
              //     [
              //       platformUrl(
              //         platform,
              //         `/lol/spectator/v4/active-games/by-summoner/${(
              //           summonerId
              //         )}`,
              //       ),
              //       'get',
              //     ],
              //     { headers: { [xRiotToken]: config.lolApiKey } },
              //     [RiotCurrentGameInfo.decoder, 'RiotCurrentGameInfo'],
              //   ),
              //   statusesToOption(404),
              // ),
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
                        regionalUrl(`/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`),
                        'get',
                      ],
                      { headers: { [xRiotToken]: config.accountApiKey } },
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

const staticData =
  <I, A>([decoder, decoderName]: Tuple<Decoder<I, A>, string>) =>
  <B>(f: (b: B) => Maybe<I>) =>
  (b: B): Future<Maybe<A>> =>
    pipe(
      f(b),
      futureMaybe.fromOption,
      futureMaybe.chainEitherK(u =>
        pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u))),
      ),
    )

const rankedGame: unknown = {
  gameId: 6412333771,
  mapId: 11,
  gameMode: 'CLASSIC',
  gameType: 'MATCHED_GAME',
  gameQueueConfigId: 420,
  participants: [
    {
      teamId: 100,
      spell1Id: 4,
      spell2Id: 7,
      championId: 902,
      profileIconId: 4861,
      summonerName: 'alvarooo',
      bot: false,
      summonerId: 'IIJWgYwe1Df2AVzGUlAh7EhBAnuAOcim1wdOQYJ1AuYiOcc',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8214, 8226, 8210, 8237, 8345, 8347, 5008, 5008, 5002],
        perkStyle: 8200,
        perkSubStyle: 8300,
      },
    },
    {
      teamId: 100,
      spell1Id: 11,
      spell2Id: 4,
      championId: 107,
      profileIconId: 5408,
      summonerName: 'EUW2',
      bot: false,
      summonerId: 'ybeXetWBsvVHAI3hKdKEtzViASuDDI_4SFNG6cXaYxKhuKgs',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8369, 8304, 8321, 8347, 8138, 8105, 5005, 5008, 5001],
        perkStyle: 8300,
        perkSubStyle: 8100,
      },
    },
    {
      teamId: 100,
      spell1Id: 12,
      spell2Id: 4,
      championId: 79,
      profileIconId: 5602,
      summonerName: 'den store mand',
      bot: false,
      summonerId: 'I3cQe93Ei1bQP2wuUdDjIoWTRo8SVnL9eBNEFbQvCfXDABM',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8369, 8304, 8345, 8347, 8226, 8210, 5008, 5008, 5001],
        perkStyle: 8300,
        perkSubStyle: 8200,
      },
    },
    {
      teamId: 100,
      spell1Id: 3,
      spell2Id: 4,
      championId: 236,
      profileIconId: 5193,
      summonerName: '4tukano4',
      bot: false,
      summonerId: 'nvpz5-oL5pBwCfoJuNxHEVznzO5tjdWu5L_reXhWFUTOmNI',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8005, 8009, 9103, 8014, 8345, 8347, 5005, 5008, 5002],
        perkStyle: 8000,
        perkSubStyle: 8300,
      },
    },
    {
      teamId: 100,
      spell1Id: 4,
      spell2Id: 14,
      championId: 39,
      profileIconId: 26,
      summonerName: 'Alluka zldyck',
      bot: false,
      summonerId: '2Hvq6eeY5GoAfSdkOutuQ38StWavVWyVIsddyj5Ky464E8UFdIUpv7YQRw',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8010, 8009, 9104, 8299, 8345, 8347, 5005, 5008, 5003],
        perkStyle: 8000,
        perkSubStyle: 8300,
      },
    },
    {
      teamId: 200,
      spell1Id: 14,
      spell2Id: 4,
      championId: 105,
      profileIconId: 1595,
      summonerName: 'SLEYERCOOL666666',
      bot: false,
      summonerId: 'kELMo6bB5wnlBmfY-0rbR5IgQle_GILgyQnuNSSUID7uHc8',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8369, 8304, 8321, 8347, 8226, 8210, 5005, 5008, 5001],
        perkStyle: 8300,
        perkSubStyle: 8200,
      },
    },
    {
      teamId: 200,
      spell1Id: 4,
      spell2Id: 7,
      championId: 1,
      profileIconId: 577,
      summonerName: 'GodShiva5',
      bot: false,
      summonerId: 'wL2_W266OIMp76AUVLjI1-U1g0gRLh3LEQ97kegJ9fHoHds',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8351, 8304, 8345, 8347, 8463, 8444, 5008, 5008, 5002],
        perkStyle: 8300,
        perkSubStyle: 8400,
      },
    },
    {
      teamId: 200,
      spell1Id: 12,
      spell2Id: 4,
      championId: 516,
      profileIconId: 1386,
      summonerName: 'D Shemek S',
      bot: false,
      summonerId: 'kNIKsFVHFDXkY92oyIvFoewT8a-vItbpUpqSkE0BhAeUbLc',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8437, 8446, 8444, 8451, 8345, 8304, 5005, 5008, 5003],
        perkStyle: 8400,
        perkSubStyle: 8300,
      },
    },
    {
      teamId: 200,
      spell1Id: 4,
      spell2Id: 11,
      championId: 11,
      profileIconId: 4071,
      summonerName: 'Just Engageee',
      bot: false,
      summonerId: '-DGNh8sTCokgV1GYLP9awmZO3NBIF7ufOhnF9kc_tDUguic',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8008, 9111, 9104, 8299, 8143, 8135, 5005, 5008, 5001],
        perkStyle: 8000,
        perkSubStyle: 8100,
      },
    },
    {
      teamId: 200,
      spell1Id: 6,
      spell2Id: 4,
      championId: 96,
      profileIconId: 5799,
      summonerName: 'Noah7',
      bot: false,
      summonerId: 'RZsBWmgxgMCn9CzXV_MIxuPOSPnpbMFtopvkz90JEKOcxSrk9SFQY9XH4A',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8008, 9111, 9103, 8299, 8429, 8451, 5005, 5008, 5002],
        perkStyle: 8000,
        perkSubStyle: 8400,
      },
    },
  ],
  observers: { encryptionKey: 'kAnY5Dsp9NV7SMmh1wx3PUxOnSasZvL0' },
  platformId: 'EUW1',
  bannedChampions: [
    { championId: 200, teamId: 100, pickTurn: 1 },
    { championId: 254, teamId: 100, pickTurn: 2 },
    { championId: 53, teamId: 100, pickTurn: 3 },
    { championId: 2, teamId: 100, pickTurn: 4 },
    { championId: 238, teamId: 100, pickTurn: 5 },
    { championId: 53, teamId: 200, pickTurn: 6 },
    { championId: 121, teamId: 200, pickTurn: 7 },
    { championId: 154, teamId: 200, pickTurn: 8 },
    { championId: 200, teamId: 200, pickTurn: 9 },
    { championId: 77, teamId: 200, pickTurn: 10 },
  ],
  gameStartTime: 1684575055105,
  gameLength: 508,
}

const aramGame: unknown = {
  gameId: 6412333240,
  mapId: 12,
  gameMode: 'ARAM',
  gameType: 'MATCHED_GAME',
  gameQueueConfigId: 450,
  participants: [
    {
      teamId: 100,
      spell1Id: 4,
      spell2Id: 32,
      championId: 3,
      profileIconId: 4506,
      summonerName: 'M12hi',
      bot: false,
      summonerId: 'J70Xnc4xovPUrpr_cew7xgs-qB5spkzf33Sy75a3psajefQ',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8437, 8463, 8429, 8451, 8009, 9105, 5007, 5002, 5001],
        perkStyle: 8400,
        perkSubStyle: 8000,
      },
    },
    {
      teamId: 100,
      spell1Id: 4,
      spell2Id: 6,
      championId: 22,
      profileIconId: 4851,
      summonerName: 'Night Blue',
      bot: false,
      summonerId: 'jtDweY8OHrU5FkYumNUsMbI0KKtzT1Zdtl5O-v_0-C1m',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8008, 8009, 9103, 8017, 8138, 8106, 5005, 5008, 5001],
        perkStyle: 8000,
        perkSubStyle: 8100,
      },
    },
    {
      teamId: 100,
      spell1Id: 4,
      spell2Id: 32,
      championId: 111,
      profileIconId: 3851,
      summonerName: 'Meretricious',
      bot: false,
      summonerId: 'RuLei4Czy-Elz6TpIWZrP48dnN070L4hp2Uv_ErQDf0JLe4',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8351, 8306, 8345, 8347, 8473, 8242, 5007, 5002, 5001],
        perkStyle: 8300,
        perkSubStyle: 8400,
      },
    },
    {
      teamId: 100,
      spell1Id: 32,
      spell2Id: 4,
      championId: 38,
      profileIconId: 663,
      summonerName: 'Leeqe',
      bot: false,
      summonerId: 'LERhQMgCbWJKG-VfTNungRnCtjDd0xAQRuOMRtlZfDKs2eE',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8010, 8009, 9105, 8299, 8226, 8236, 5008, 5008, 5002],
        perkStyle: 8000,
        perkSubStyle: 8200,
      },
    },
    {
      teamId: 100,
      spell1Id: 4,
      spell2Id: 6,
      championId: 119,
      profileIconId: 3217,
      summonerName: 'TonkHd',
      bot: false,
      summonerId: 'o244sJy0UnJN4JcbgrFp0uIrSDKNKxsOUVwTjGN8Uzycuzo',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [9923, 8139, 8138, 8135, 9103, 8009, 5005, 5008, 5002],
        perkStyle: 8100,
        perkSubStyle: 8000,
      },
    },
    {
      teamId: 200,
      spell1Id: 32,
      spell2Id: 4,
      championId: 81,
      profileIconId: 3008,
      summonerName: 'Beivu',
      bot: false,
      summonerId: 'FViVZdeZ4V3HoEA8kgku4s5lJeOJjfzIP9bskWVTL0cX7O0',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8010, 8009, 9103, 8014, 8226, 8210, 5008, 5008, 5002],
        perkStyle: 8000,
        perkSubStyle: 8200,
      },
    },
    {
      teamId: 200,
      spell1Id: 4,
      spell2Id: 32,
      championId: 412,
      profileIconId: 3776,
      summonerName: 'undeﬁned',
      bot: false,
      summonerId: 'WLXkYz3Wf71zNFKFZLf25LNoF8ihgSsJBD5tkoWKjz1qQT2e',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8439, 8463, 8473, 8451, 9105, 8009, 5007, 5002, 5001],
        perkStyle: 8400,
        perkSubStyle: 8000,
      },
    },
    {
      teamId: 200,
      spell1Id: 6,
      spell2Id: 32,
      championId: 24,
      profileIconId: 512,
      summonerName: 'Aconda',
      bot: false,
      summonerId: '4cSuEJ1ZhqispTAkUpAwVTa0uXnABJ4_sCwNn0b60D1pQuA',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8008, 9111, 9105, 8299, 8304, 8347, 5005, 5008, 5002],
        perkStyle: 8000,
        perkSubStyle: 8300,
      },
    },
    {
      teamId: 200,
      spell1Id: 3,
      spell2Id: 4,
      championId: 145,
      profileIconId: 5804,
      summonerName: 'GOTH ANGEL KAISA',
      bot: false,
      summonerId: 'Dxk0EngMZu4QO_esC28Qupded2GDneXUtpcI86tLC0sxv-s',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8008, 8009, 9103, 8017, 8138, 8106, 5005, 5008, 5001],
        perkStyle: 8000,
        perkSubStyle: 8100,
      },
    },
    {
      teamId: 200,
      spell1Id: 32,
      spell2Id: 4,
      championId: 102,
      profileIconId: 5726,
      summonerName: 'Jhin is ma bae',
      bot: false,
      summonerId: 'yqsCydFsE6IFYn-9fNfQ2-qSJMOalgcdNw6-UwPIamBrf8c',
      gameCustomizationObjects: [],
      perks: {
        perkIds: [8128, 8139, 8138, 8135, 8210, 8236, 5007, 5008, 5001],
        perkStyle: 8100,
        perkSubStyle: 8200,
      },
    },
  ],
  observers: { encryptionKey: 'N35RS6z6yChylBkZN8NGIp8vg0dAObiK' },
  platformId: 'EUW1',
  bannedChampions: [],
  gameStartTime: 1684575183877,
  gameLength: 296,
}
