import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit } from 'fp-ts-routing'

import type { Method } from './models/Method'
import { Lang } from './models/api/Lang'
import { Platform } from './models/api/Platform'
import { Puuid } from './models/api/summoner/Puuid'
import { GameName } from './models/riot/GameName'
import { RiotId } from './models/riot/RiotId'
import { SummonerName } from './models/riot/SummonerName'
import { TagLine } from './models/riot/TagLine'
import { RouterUtils } from './utils/RouterUtils'
import type { Dict, Tuple } from './utils/fp'

const { codec } = RouterUtils

/**
 * matches
 */

// intermediate

const langM = codec('lang', Lang.codec)
const platformM = codec('platform', Platform.codec)
const puuidM = codec('puuid', Puuid.codec)
const riotIdM = codec('gameName', GameName.codec)
  .then(codec('tagLine', TagLine.codec))
  .imap(
    ({ gameName, tagLine }) => ({ riotId: RiotId(gameName, tagLine) }),
    ({ riotId }) => riotId,
  )

const api = lit('api')
const staticDataLang = api.then(lit('staticData')).then(langM)

const summoner = api.then(lit('summoner'))
const summonerByPuuid = summoner.then(lit('byPuuid')).then(platformM).then(puuidM)
const summonerByName = summoner
  .then(lit('byName'))
  .then(platformM)
  .then(codec('summonerName', SummonerName.codec))
const summonerByRiotId = summoner.then(lit('byRiotId')).then(platformM).then(riotIdM)

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

const summonerByPuuidMasteriesGet = m(summonerByPuuid.then(lit('masteries')), 'get')
const summonerByPuuidChallengesGet = m(summonerByPuuid.then(lit('challenges')), 'get')
const summonerByPuuidActiveGameLangGet = m(
  summonerByPuuid.then(lit('active-game').then(langM)),
  'get',
)

const summonerByNameMasteriesGet = m(summonerByName.then(lit('masteries')), 'get')
const summonerByNameActiveGameLangGet = m(summonerByName.then(lit('activeGame')).then(langM), 'get')

const summonerByRiotIdMasteriesGet = m(summonerByRiotId.then(lit('masteries')), 'get')
const summonerByRiotIdActiveGameLangGet = m(
  summonerByRiotId.then(lit('active-game').then(langM)),
  'get',
)

const userSelfGet = m(userSelf, 'get')
const userSelfFavoritesPut = m(userSelfFavorites, 'put')
const userSelfFavoritesDelete = m(userSelfFavorites, 'delete')
const userSelfSummonerChampionsShardsCountPost = m(
  userSelf.then(lit('summoner')).then(platformM).then(puuidM).then(lit('championsShardsCount')),
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
    byPuuid: {
      masteries: { get: p(summonerByPuuidMasteriesGet) },
      challenges: { get: p(summonerByPuuidChallengesGet) },
      activeGame: { lang: { get: p(summonerByPuuidActiveGameLangGet) } },
    },
    byRiotId: {
      masteries: { get: p(summonerByRiotIdMasteriesGet) },
      activeGame: { lang: { get: p(summonerByRiotIdActiveGameLangGet) } },
    },
    /**
     * @deprecated SummonerName will be removed
     */
    // eslint-disable-next-line deprecation/deprecation
    byName: {
      masteries: { get: p(summonerByNameMasteriesGet) },
      activeGame: { lang: { get: p(summonerByNameActiveGameLangGet) } },
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
  staticData: (lang: Lang) => ({
    get: r(staticDataLangGet, { lang }),
    additional: { get: r(staticDataLangAdditionalGet, { lang }) },
  }),
  summoner: {
    byPuuid: (platform: Platform) => (puuid: Puuid) => ({
      masteries: { get: r(summonerByPuuidMasteriesGet, { platform, puuid }) },
      challenges: { get: r(summonerByPuuidChallengesGet, { platform, puuid }) },
      activeGame: (lang: Lang) => ({
        get: r(summonerByPuuidActiveGameLangGet, { platform, puuid, lang }),
      }),
    }),
    byRiotId: (platform: Platform) => (riotId_: RiotId) => {
      const riotId = RiotId.clean(riotId_)
      return {
        masteries: { get: r(summonerByRiotIdMasteriesGet, { platform, riotId }) },
        activeGame: (lang: Lang) => ({
          get: r(summonerByRiotIdActiveGameLangGet, { platform, riotId, lang }),
        }),
      }
    },
    /**
     * @deprecated
     */
    // eslint-disable-next-line deprecation/deprecation
    byName: (platform: Platform) => (summonerName_: SummonerName) => {
      const summonerName = SummonerName.clean(summonerName_)
      return {
        masteries: { get: r(summonerByNameMasteriesGet, { platform, summonerName }) },
        activeGame: (lang: Lang) => ({
          get: r(summonerByNameActiveGameLangGet, { platform, summonerName, lang }),
        }),
      }
    },
  },
  user: {
    self: {
      get: r(userSelfGet, {}),
      favorites: {
        put: r(userSelfFavoritesPut, {}),
        delete: r(userSelfFavoritesDelete, {}),
      },
      summoner: (platform: Platform) => (puuid: Puuid) => ({
        championsShardsCount: {
          post: r(userSelfSummonerChampionsShardsCountPost, { platform, puuid }),
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
