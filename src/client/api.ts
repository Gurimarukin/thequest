import * as E from 'io-ts/Encoder'

import { apiRoutes } from '../shared/ApiRouter'
import type { ChampionKey } from '../shared/models/api/ChampionKey'
import type { Platform } from '../shared/models/api/Platform'
import { ChampionShardsPayload } from '../shared/models/api/summoner/ChampionShardsPayload'
import { PlatformWithName } from '../shared/models/api/summoner/PlatformWithName'
import { LoginPasswordPayload } from '../shared/models/api/user/LoginPasswordPayload'
import type { Future } from '../shared/utils/fp'
import { NonEmptyArray } from '../shared/utils/fp'

import { http } from './utils/http'

export const apiUserRegisterPost = (payload: LoginPasswordPayload): Future<unknown> =>
  http(apiRoutes.user.register.password.post, { json: [LoginPasswordPayload.codec, payload] })

export const apiUserLoginPasswordPost = (payload: LoginPasswordPayload): Future<unknown> =>
  http(apiRoutes.user.login.password.post, { json: [LoginPasswordPayload.codec, payload] })

export const apiUserLogoutPost: Future<unknown> = http(apiRoutes.user.logout.post)

export const apiUserSelfFavoritesPut = (platformWithName: PlatformWithName): Future<unknown> =>
  http(apiRoutes.user.self.favorites.put, { json: [PlatformWithName.codec, platformWithName] })

export const apiUserSelfFavoritesDelete = (platformWithName: PlatformWithName): Future<unknown> =>
  http(apiRoutes.user.self.favorites.delete, { json: [PlatformWithName.codec, platformWithName] })

export const apiUserSelfSummonerChampionsShardsCountPost = (
  platform: Platform,
  summonerName: string,
  championsShards: NonEmptyArray<ChampionShardsPayload>,
): Future<unknown> =>
  http(apiRoutes.user.self.summoner(platform, summonerName).championsShardsCount.post, {
    json: [NonEmptyArray.encoder(ChampionShardsPayload.codec), championsShards],
  })

export const apiUserSelfSummonerChampionShardsCountPut = (
  platform: Platform,
  summonerName: string,
  championKey: ChampionKey,
  shardsCount: number,
): Future<unknown> =>
  http(apiRoutes.user.self.summoner(platform, summonerName).champion(championKey).shardsCount.put, {
    json: [E.id<number>(), shardsCount],
  })
