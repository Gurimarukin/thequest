import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit, str } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import type { Method } from './models/Method'
import { ChampionKey } from './models/api/ChampionKey'
import { Lang } from './models/api/Lang'
import { Platform } from './models/api/Platform'
import { SummonerId } from './models/api/summoner/SummonerId'
import { RouterUtils } from './utils/RouterUtils'
import type { Dict, Tuple } from './utils/fp'
import { NumberFromString } from './utils/ioTsUtils'

const { codec } = RouterUtils

const championKeyFromStringCodec: Codec<unknown, string, ChampionKey> = pipe(
  NumberFromString.codec,
  C.compose(ChampionKey.codec),
)

/**
 * matches
 */

// intermediate
const api = lit('api')
const apiHealthcheck = api.then(lit('healthcheck'))
const apiStaticDataLang = api.then(lit('staticData')).then(codec('lang', Lang.codec))
const apiPlatform = api.then(codec('platform', Platform.codec))
const apiPlatformSummoner = apiPlatform.then(lit('summoner'))
const apiPlatformSummonerByName = apiPlatformSummoner.then(lit('byName')).then(str('summonerName'))
const apiUser = api.then(lit('user'))
const apiUserSelf = apiUser.then(lit('self'))
const apiUserSelfFavorites = apiUserSelf.then(lit('favorites'))
const apiUserSelfSummonerByIdChampionByKeyShardsCount = apiUserSelf
  .then(lit('summoner'))
  .then(codec('summonerId', SummonerId.codec))
  .then(lit('champion'))
  .then(codec('championKey', championKeyFromStringCodec))
  .then(lit('shardsCount'))
const apiUserLogin = apiUser.then(lit('login'))
const apiUserLoginDiscord = apiUserLogin.then(lit('discord'))
const apiUserLoginPassword = apiUserLogin.then(lit('password'))
const apiUserLogout = apiUser.then(lit('logout'))
const apiUserRegister = apiUser.then(lit('register'))
const apiUserRegisterDiscord = apiUserRegister.then(lit('discord'))
const apiUserRegisterPassword = apiUserRegister.then(lit('password'))

// final
const healthcheckGet = m(apiHealthcheck, 'get')
const staticDataLangGet = m(apiStaticDataLang, 'get')
const platformSummonerByNameGet = m(apiPlatformSummonerByName, 'get')
const userSelfGet = m(apiUserSelf, 'get')
const userSelfFavoritesPut = m(apiUserSelfFavorites, 'put')
const userSelfFavoritesDelete = m(apiUserSelfFavorites, 'delete')
const apiUserSelfSummonerByIdChampionByKeyShardsCountPut = m(
  apiUserSelfSummonerByIdChampionByKeyShardsCount,
  'put',
)
const userLoginDiscordPost = m(apiUserLoginDiscord, 'post')
const userLoginPasswordPost = m(apiUserLoginPassword, 'post')
const userLogoutPost = m(apiUserLogout, 'post')
const userRegisterDiscordPost = m(apiUserRegisterDiscord, 'post')
const userRegisterPasswordPost = m(apiUserRegisterPassword, 'post')

/**
 * parsers
 */

export const apiParsers = {
  healthcheck: { get: p(healthcheckGet) },
  staticData: { lang: { get: p(staticDataLangGet) } },
  platform: {
    summoner: {
      byName: { get: p(platformSummonerByNameGet) },
    },
  },
  user: {
    self: {
      get: p(userSelfGet),
      favorites: {
        put: p(userSelfFavoritesPut),
        delete: p(userSelfFavoritesDelete),
      },
      summoner: {
        champion: {
          shardsCount: { put: p(apiUserSelfSummonerByIdChampionByKeyShardsCountPut) },
        },
      },
    },
    login: {
      discord: { post: p(userLoginDiscordPost) },
      password: { post: p(userLoginPasswordPost) },
    },
    logout: { post: p(userLogoutPost) },
    register: {
      discord: { post: p(userRegisterDiscordPost) },
      password: { post: p(userRegisterPasswordPost) },
    },
  },
}

/**
 * formats
 */

export const apiRoutes = {
  staticData: { lang: { get: (lang: Lang) => r(staticDataLangGet, { lang }) } },
  platform: {
    summoner: {
      byName: {
        get: (platform: Platform, summonerName: string) =>
          r(platformSummonerByNameGet, { platform, summonerName }),
      },
    },
  },
  user: {
    self: {
      get: r(userSelfGet, {}),
      favorites: {
        put: r(userSelfFavoritesPut, {}),
        delete: r(userSelfFavoritesDelete, {}),
      },
      summoner: {
        champion: {
          shardsCount: {
            put: (summonerId: SummonerId, championKey: ChampionKey) =>
              r(apiUserSelfSummonerByIdChampionByKeyShardsCountPut, { summonerId, championKey }),
          },
        },
      },
    },
    login: {
      discord: { post: r(userLoginDiscordPost, {}) },
      password: { post: r(userLoginPasswordPost, {}) },
    },
    logout: { post: r(userLogoutPost, {}) },
    register: {
      discord: { post: r(userRegisterDiscordPost, {}) },
      password: { post: r(userRegisterPasswordPost, {}) },
    },
  },
}

/**
 * Helpers
 */

type WithMethod<A> = Tuple<A, Method>
type MatchWithMethod<A> = WithMethod<Match<A>>
export type ParserWithMethod<A> = WithMethod<Parser<A>>
export type RouteWithMethod = WithMethod<string>

// Match with Method
function m<A extends Dict<string, unknown>>(match: Match<A>, method: Method): MatchWithMethod<A> {
  return [match.then(end), method]
}

// Parser with Method
function p<A>([match, method]: MatchWithMethod<A>): ParserWithMethod<A> {
  return [match.parser, method]
}

// Route with Method
function r<A>([match, method]: MatchWithMethod<A>, a: A): RouteWithMethod {
  return [format(match.formatter, a), method]
}
