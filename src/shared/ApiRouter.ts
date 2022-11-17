import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit, str } from 'fp-ts-routing'

import type { Method } from './models/Method'
import { Lang } from './models/api/Lang'
import { Platform } from './models/api/Platform'
import { RouterUtils } from './utils/RouterUtils'
import type { Dict, Tuple } from './utils/fp'

const { codec } = RouterUtils

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
const apiUserLogin = apiUser.then(lit('login'))
const apiUserLogout = apiUser.then(lit('logout'))

// final
const healthcheckGet = m(apiHealthcheck, 'get')
const staticDataLangGet = m(apiStaticDataLang, 'get')
const platformSummonerByNameGet = m(apiPlatformSummonerByName, 'get')
const userSelfGet = m(apiUserSelf, 'get')
const userSelfFavoritesPut = m(apiUserSelfFavorites, 'put')
const userLoginPost = m(apiUserLogin, 'post')
const userLogoutPost = m(apiUserLogout, 'post')

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
      favorites: { put: p(userSelfFavoritesPut) },
    },
    login: { post: p(userLoginPost) },
    logout: { post: p(userLogoutPost) },
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
      favorites: { put: r(userSelfFavoritesPut, {}) },
    },
    login: { post: r(userLoginPost, {}) },
    logout: { post: r(userLogoutPost, {}) },
  },
}

/**
 * Helpers
 */

type WithMethod<A> = Tuple<A, Method>
type MatchWithMethod<A> = WithMethod<Match<A>>
export type ParserWithMethod<A> = WithMethod<Parser<A>>
type RouteWithMethod = WithMethod<string>

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
