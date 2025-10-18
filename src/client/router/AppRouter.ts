import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit } from 'fp-ts-routing'
import type { Codec } from 'io-ts/Codec'

import { Platform } from '../../shared/models/api/Platform'
import type { PlatformWithRiotId } from '../../shared/models/api/summoner/PlatformWithRiotId'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { RiotId } from '../../shared/models/riot/RiotId'
import { RouterUtils } from '../../shared/utils/RouterUtils'
import { StringUtils } from '../../shared/utils/StringUtils'

import { PartialGenericQuery } from '../models/genericQuery/PartialGenericQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'
import { adminParsers } from './AdminRouter'

const { codec } = RouterUtils

export const riotIdCodec: Codec<unknown, string, RiotId> = RiotId.getFromStringCodec('-')

/**
 * matches
 */

const platformM = codec('platform', Platform.orLowerCaseCodec)

const sPlatformPuuidMatch = lit('s').then(platformM).then(codec('puuid', Puuid.codec))
const sPlatformPuuidGameMatch = sPlatformPuuidMatch.then(lit('game'))

const platformRiotIdMatch = platformM.then(codec('riotId', riotIdCodec))
const platformRiotIdGameMatch = platformRiotIdMatch.then(lit('game'))

const aramMatch = lit('aram')
const urfMatch = lit('urf')
const factionsMatch = lit('factions')
const timersMatch = lit('timers')

const loginMatch = lit('login')
const registerMatch = lit('register')
const discordRedirectMatch = lit('discordRedirect')

export const appMatches = {
  sPlatformPuuid: sPlatformPuuidMatch.then(end),
  sPlatformPuuidGame: sPlatformPuuidGameMatch.then(end),

  platformRiotId: platformRiotIdMatch.then(end),
  platformRiotIdGame: platformRiotIdGameMatch.then(end),
}

/**
 * parsers
 *
 * Don't forget .then(end).parser (or use p)
 */

const sPlatformPuuid = p(sPlatformPuuidMatch)
const sPlatformPuuidGame = p(sPlatformPuuidGameMatch)

const platformRiotId = p(platformRiotIdMatch)
const platformRiotIdGame = p(platformRiotIdGameMatch)

const anyPlatformRiotId: Parser<PlatformWithRiotId> = platformRiotId
  .alt(platformRiotIdGame)
  .map(({ platform, riotId }) => ({
    platform: StringUtils.toUpperCase(platform),
    riotId,
  }))

const anyPlatform: Parser<{ platform: Platform }> = sPlatformPuuid
  .alt(sPlatformPuuidGame)
  .map(({ platform }) => ({ platform: StringUtils.toUpperCase(platform) }))
  .alt(anyPlatformRiotId)

export const appParsers = {
  index: end.parser,

  sPlatformPuuid,
  sPlatformPuuidGame,

  platformRiotId,
  platformRiotIdGame,

  aram: p(aramMatch),
  urf: p(urfMatch),
  factions: p(factionsMatch),
  timers: p(timersMatch),

  login: p(loginMatch),
  register: p(registerMatch),
  discordRedirect: p(discordRedirectMatch),

  anyAdmin: adminParsers.any,

  anyPlatform,
  anyPlatformRiotId,
}

/**
 * routes
 */

export const appRoutes = {
  index: format(end.formatter, {}),

  sPlatformPuuid: (platform: Platform, puuid: Puuid, query: PartialMasteriesQuery) =>
    withQuery(
      format(sPlatformPuuidMatch.formatter, { platform, puuid }),
      PartialMasteriesQuery,
      query,
    ),
  sPlatformPuuidGame: (platform: Platform, puuid: Puuid) =>
    format(sPlatformPuuidGameMatch.formatter, { platform, puuid }),

  platformRiotId: (platform: Platform, riotId: RiotId, query: PartialMasteriesQuery) =>
    withQuery(
      format(platformRiotIdMatch.formatter, { platform, riotId }),
      PartialMasteriesQuery,
      query,
    ),
  platformRiotIdGame: (platform: Platform, riotId: RiotId) =>
    format(platformRiotIdGameMatch.formatter, { platform, riotId }),

  aram: (query: PartialGenericQuery) =>
    withQuery(format(aramMatch.formatter, {}), PartialGenericQuery, query),
  urf: (query: PartialGenericQuery) =>
    withQuery(format(urfMatch.formatter, {}), PartialGenericQuery, query),
  factions: (query: PartialGenericQuery) =>
    withQuery(format(factionsMatch.formatter, {}), PartialGenericQuery, query),
  timers: format(timersMatch.formatter, {}),

  login: format(loginMatch.formatter, {}),
  register: format(registerMatch.formatter, {}),
}

const withQuery = <A>(
  path: string,
  { qsStringify }: { qsStringify: (a: A) => string },
  a: A,
): string => {
  const query = qsStringify(a)
  return `${path}${query === '' ? '' : `?${query}`}`
}

function p<A>(match: Match<A>): Parser<A> {
  return match.then(end).parser
}
