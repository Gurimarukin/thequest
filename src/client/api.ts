import { pipe } from 'fp-ts/function'

import { apiRoutes } from '../shared/ApiRouter'
import type { Platform } from '../shared/models/api/Platform'
import { HallOfFameMembersPayload } from '../shared/models/api/madosayentisuto/HallOfFameMembersPayload'
import { ChampionShardsPayload } from '../shared/models/api/summoner/ChampionShardsPayload'
import { PlatformWithPuuid } from '../shared/models/api/summoner/PlatformWithPuuid'
import { Puuid } from '../shared/models/api/summoner/Puuid'
import { SummonerShort } from '../shared/models/api/summoner/SummonerShort'
import { LoginPasswordPayload } from '../shared/models/api/user/LoginPasswordPayload'
import type { RiotId } from '../shared/models/riot/RiotId'
import type { Future, Maybe } from '../shared/utils/fp'

import { http, statusesToOption } from './utils/http'

export function apiSummonerGet(platform: Platform, riotId: RiotId): Future<Maybe<SummonerShort>> {
  return pipe(
    http(apiRoutes.summoner.byRiotId(platform)(riotId).get, {}, [
      SummonerShort.codec,
      'SummonerShort',
    ]),
    statusesToOption(404),
  )
}

export function apiUserRegisterPost(payload: LoginPasswordPayload): Future<unknown> {
  return http(apiRoutes.user.register.password.post, {
    json: [LoginPasswordPayload.codec, payload],
  })
}

export function apiUserLoginPasswordPost(payload: LoginPasswordPayload): Future<unknown> {
  return http(apiRoutes.user.login.password.post, { json: [LoginPasswordPayload.codec, payload] })
}

export const apiUserLogoutPost: Future<unknown> = http(apiRoutes.user.logout.post)

export function apiUserSelfFavoritesPut(platformWithPuuid: PlatformWithPuuid): Future<unknown> {
  return http(apiRoutes.user.self.favorites.put, {
    json: [PlatformWithPuuid.codec, platformWithPuuid],
  })
}

export function apiUserSelfFavoritesDelete(puuid: Puuid): Future<unknown> {
  return http(apiRoutes.user.self.favorites.delete, { json: [Puuid.codec, puuid] })
}

export function apiUserSelfSummonerChampionsShardsCountPost(
  platform: Platform,
  puuid: Puuid,
  championsShards: ChampionShardsPayload,
): Future<unknown> {
  return http(apiRoutes.user.self.summoner(platform)(puuid).championsShardsCount.post, {
    json: [ChampionShardsPayload.codec, championsShards],
  })
}

export function apiAdminMadosayentisutoPost(payload: HallOfFameMembersPayload): Future<unknown> {
  return http(apiRoutes.admin.madosayentisuto.post, {
    json: [HallOfFameMembersPayload.codec, payload],
  })
}
