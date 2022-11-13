import type { Decoder } from 'io-ts/Decoder'

import type { Method } from '../../shared/models/Method'
import { Platform } from '../../shared/models/Platform'
import { SummonerId } from '../../shared/models/SummonerId'
import type { Future, Tuple } from '../../shared/utils/fp'
import { List } from '../../shared/utils/fp'

import { constants } from '../config/constants'
import type { HttpClient, HttpOptions } from '../helpers/HttpClient'
import { ChampionMastery } from '../models/riot/ChampionMastery'
import { Summoner } from '../models/riot/Summoner'

type RiotApiService = ReturnType<typeof RiotApiService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotApiService = (riotApiKey: string, httpClient: HttpClient) => {
  return {
    lol: {
      summoner: {
        byName: (platform: Platform, summonerName: string): Future<Summoner> =>
          http([[platform, `/lol/summoner/v4/summoners/by-name/${summonerName}`], 'get'], {}, [
            Summoner.codec,
            'Summoner',
          ]),
      },
      championMasteryBySummoner: (
        platform: Platform,
        encryptedSummonerId: SummonerId,
      ): Future<List<ChampionMastery>> =>
        http(
          [
            [
              platform,
              `/lol/champion-mastery/v4/champion-masteries/by-summoner/${SummonerId.unwrap(
                encryptedSummonerId,
              )}`,
            ],
            'get',
          ],
          {},
          [List.decoder(ChampionMastery.codec), 'List<ChampionMastery>'],
        ),
    },
  }

  function http<O, B>(
    methodWithUrl: Tuple<Tuple<Platform, string>, Method>,
    options?: HttpOptions<O, B>,
  ): Future<unknown>
  function http<A, O, B>(
    methodWithUrl: Tuple<Tuple<Platform, string>, Method>,
    options: HttpOptions<O, B>,
    decoderWithName: Tuple<Decoder<unknown, A>, string>,
  ): Future<A>
  function http<A, O, B>(
    [[platform, path], method]: Tuple<Tuple<Platform, string>, Method>,
    options: HttpOptions<O, B> = {},
    decoderWithName?: Tuple<Decoder<unknown, A>, string>,
  ): Future<A> {
    return httpClient.http(
      [`https://${Platform.endpoint[platform]}${path}`, method],
      {
        ...options,
        headers: {
          ...options.headers,
          [constants.xRiotToken]: riotApiKey,
        },
      },
      decoderWithName as Tuple<Decoder<unknown, A>, string>,
    )
  }
}

export { RiotApiService }
