import type { Decoder } from 'io-ts/Decoder'

import type { Method } from '../../shared/models/Method'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { Lang } from '../../shared/models/api/Lang'
import { Platform } from '../../shared/models/api/Platform'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import type { Future, Tuple } from '../../shared/utils/fp'
import { List, NonEmptyArray } from '../../shared/utils/fp'

import { constants } from '../config/constants'
import type { HttpClient, HttpOptions } from '../helpers/HttpClient'
import { Puuid } from '../models/riot/Puuid'
import { RiotChampionMastery } from '../models/riot/RiotChampionMastery'
import { RiotSummoner } from '../models/riot/RiotSummoner'
import { SummonerId } from '../models/riot/SummonerId'
import { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'

const { ddragon, ddragonCdn } = DDragonUtils

const platformUrl = (platform: Platform, path: string): string =>
  `https://${Platform.endpoint[platform]}${path}`

type RiotApiService = ReturnType<typeof RiotApiService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotApiService = (riotApiKey: string, httpClient: HttpClient) => {
  const lolDDragonApiVersions: Future<NonEmptyArray<DDragonVersion>> = httpClient.http(
    [ddragon('/api/versions.json'), 'get'],
    {},
    [NonEmptyArray.decoder(DDragonVersion.codec), 'NonEmptyArray<DDragonVersion>'],
  )

  return {
    lol: {
      ddragon: {
        apiVersions: lolDDragonApiVersions,
        dataChampions: (version: DDragonVersion, lang: Lang): Future<DDragonChampions> =>
          httpClient.http([ddragonCdn(version, `/data/${lang}/champion.json`), 'get'], {}, [
            DDragonChampions.decoder,
            'DDragonChampions',
          ]),
      },

      summoner: {
        byName: (platform: Platform, summonerName: string): Future<RiotSummoner> =>
          httpWithApiKey(
            [platformUrl(platform, `/lol/summoner/v4/summoners/by-name/${summonerName}`), 'get'],
            {},
            [RiotSummoner.decoder, 'RiotSummoner'],
          ),

        byPuuid: (platform: Platform, encryptedPUUID: Puuid) =>
          httpWithApiKey(
            [
              platformUrl(
                platform,
                `/lol/summoner/v4/summoners/by-puuid/${Puuid.unwrap(encryptedPUUID)}`,
              ),
              'get',
            ],
            {},
            [RiotSummoner.decoder, 'RiotSummoner'],
          ),

        /**
         * ⚠️  Consistently looking up summoner ids that don't exist will result in a blacklist.
         * @deprecated
         */
        byId: (platform: Platform, encryptedSummonerId: SummonerId): Future<RiotSummoner> =>
          httpWithApiKey(
            [
              platformUrl(
                platform,
                `/lol/summoner/v4/summoners/${SummonerId.unwrap(encryptedSummonerId)}`,
              ),
              'get',
            ],
            {},
            [RiotSummoner.decoder, 'RiotSummoner'],
          ),
      },

      championMasteryBySummoner: (
        platform: Platform,
        encryptedSummonerId: SummonerId,
      ): Future<List<RiotChampionMastery>> =>
        httpWithApiKey(
          [
            platformUrl(
              platform,
              `/lol/champion-mastery/v4/champion-masteries/by-summoner/${SummonerId.unwrap(
                encryptedSummonerId,
              )}`,
            ),
            'get',
          ],
          {},
          [List.decoder(RiotChampionMastery.decoder), 'List<ChampionMastery>'],
        ),
    },
  }

  // httpClient.http, but with riotApiKey
  function httpWithApiKey<O, B>(
    methodWithUrl: Tuple<string, Method>,
    options?: HttpOptions<O, B>,
  ): Future<unknown>
  function httpWithApiKey<A, O, B>(
    methodWithUrl: Tuple<string, Method>,
    options: HttpOptions<O, B>,
    decoderWithName: Tuple<Decoder<unknown, A>, string>,
  ): Future<A>
  function httpWithApiKey<A, O, B>(
    [url, method]: Tuple<string, Method>,
    options: HttpOptions<O, B> = {},
    decoderWithName?: Tuple<Decoder<unknown, A>, string>,
  ): Future<A> {
    return httpClient.http(
      [url, method],
      {
        ...options,
        headers: {
          ...options.headers,
          [constants.riotApi.xRiotToken]: riotApiKey,
        },
      },
      decoderWithName as Tuple<Decoder<unknown, A>, string>,
    )
  }
}

export { RiotApiService }
