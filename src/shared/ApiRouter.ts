import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit, str } from 'fp-ts-routing'

import type { Method } from './models/Method'
import { Lang } from './models/api/Lang'
import { Platform } from './models/api/Platform'
import { Puuid } from './models/api/summoner/Puuid'
import { RouterUtils } from './utils/RouterUtils'
import type { Dict, Tuple } from './utils/fp'

const { codec } = RouterUtils

/**
 * matches
 */

// intermediate

const api = lit('api')
const staticDataLang = api.then(lit('staticData')).then(codec('lang', Lang.codec))
const summoner = api.then(lit('summoner'))
const summonerByName = summoner
  .then(lit('byName'))
  .then(codec('platform', Platform.codec))
  .then(str('summonerName'))
const user = api.then(lit('user'))
const userSelf = user.then(lit('self'))
const userSelfFavorites = userSelf.then(lit('favorites'))
const userLogin = user.then(lit('login'))
const userRegister = user.then(lit('register'))
const madosayentisuto = api.then(lit('madosayentisuto'))

// final

const healthcheckGet = m(api.then(lit('healthcheck')), 'get')
const staticDataLangGet = m(staticDataLang, 'get')
const staticDataLangAdditionalGet = m(staticDataLang.then(lit('additional')), 'get')
const summonerByPuuidMasteriesGet = m(
  summoner
    .then(lit('byPuuid'))
    .then(codec('platform', Platform.codec))
    .then(codec('puuid', Puuid.codec))
    .then(lit('masteries')),
  'get',
)
const summonerByNameMasteriesGet = m(summonerByName.then(lit('masteries')), 'get')
const summonerByNameActiveGameGet = m(summonerByName.then(lit('active-game')), 'get')
const userSelfGet = m(userSelf, 'get')
const userSelfFavoritesPut = m(userSelfFavorites, 'put')
const userSelfFavoritesDelete = m(userSelfFavorites, 'delete')
const userSelfSummonerChampionsShardsCountPost = m(
  userSelf
    .then(lit('summoner'))
    .then(codec('platform', Platform.codec))
    .then(str('summonerName'))
    .then(lit('championsShardsCount')),
  'post',
)
const userLoginDiscordPost = m(userLogin.then(lit('discord')), 'post')
const userLoginPasswordPost = m(userLogin.then(lit('password')), 'post')
const userLogoutPost = m(user.then(lit('logout')), 'post')
const userRegisterDiscordPost = m(userRegister.then(lit('discord')), 'post')
const userRegisterPasswordPost = m(userRegister.then(lit('password')), 'post')
const madosayentisutoStaticDataGet = m(madosayentisuto.then(lit('staticData')), 'get')
const madosayentisutoUsersGetProgressionPost = m(
  madosayentisuto.then(lit('users')).then(lit('getProgression')),
  'post',
)

/**
 * parsers
 */

export const apiParsers = {
  healthcheck: { get: p(healthcheckGet) },
  staticData: {
    lang: {
      get: p(staticDataLangGet),
      additional: { get: p(staticDataLangAdditionalGet) },
    },
  },
  summoner: {
    byPuuid: { masteries: { get: p(summonerByPuuidMasteriesGet) } },
    byName: {
      masteries: { get: p(summonerByNameMasteriesGet) },
      activeGame: { get: p(summonerByNameActiveGameGet) },
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
        championsShardsCount: { post: p(userSelfSummonerChampionsShardsCountPost) },
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
  madosayentisuto: {
    staticData: { get: p(madosayentisutoStaticDataGet) },
    users: {
      getProgression: { post: p(madosayentisutoUsersGetProgressionPost) },
    },
  },
}

/**
 * formats
 */

export const apiRoutes = {
  staticData: {
    lang: (lang: Lang) => ({
      get: r(staticDataLangGet, { lang }),
      additional: { get: r(staticDataLangAdditionalGet, { lang }) },
    }),
  },
  summoner: {
    byPuuid: (platform: Platform, puuid: Puuid) => ({
      masteries: {
        get: r(summonerByPuuidMasteriesGet, { platform, puuid }),
      },
    }),
    byName: (platform: Platform, summonerName: string) => ({
      masteries: { get: r(summonerByNameMasteriesGet, { platform, summonerName }) },
      activeGame: { get: r(summonerByNameActiveGameGet, { platform, summonerName }) },
    }),
  },
  user: {
    self: {
      get: r(userSelfGet, {}),
      favorites: {
        put: r(userSelfFavoritesPut, {}),
        delete: r(userSelfFavoritesDelete, {}),
      },
      summoner: (platform: Platform, summonerName: string) => ({
        championsShardsCount: {
          post: r(userSelfSummonerChampionsShardsCountPost, { platform, summonerName }),
        },
      }),
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
