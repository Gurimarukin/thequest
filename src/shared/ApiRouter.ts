import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit, str } from 'fp-ts-routing'

import type { Method } from './models/Method'
import { Platform } from './models/Platform'
import { RouterUtils } from './utils/RouterUtils'
import type { Dict, Tuple } from './utils/fp'

const { codec } = RouterUtils

/**
 * matches
 */

// intermediate
const api = lit('api')
const apiHealthcheck = api.then(lit('healthcheck'))
const apiLogin = api.then(lit('login'))
const apiPlatform = api.then(codec('platform', Platform.codec))
const apiPlatformSummoner = apiPlatform.then(lit('summoner'))
const apiPlatformSummonerByName = apiPlatformSummoner.then(lit('byName')).then(str('summonerName'))

// final
const healthcheckGet = m(apiHealthcheck, 'get')
const platformSummonerByNameGet = m(apiPlatformSummonerByName, 'get')
const loginPost = m(apiLogin, 'post')

/**
 * parsers
 */

export const apiParsers = {
  healthcheck: { get: p(healthcheckGet) },
  platform: {
    summoner: {
      byName: { get: p(platformSummonerByNameGet) },
    },
  },
  login: { post: p(loginPost) },
}

/**
 * formats
 */

export const apiRoutes = {
  platform: {
    summoner: {
      byName: {
        get: (platform: Platform, summonerName: string) =>
          r(platformSummonerByNameGet, { platform, summonerName }),
      },
    },
  },
  login: { post: r(loginPost, {}) },
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
