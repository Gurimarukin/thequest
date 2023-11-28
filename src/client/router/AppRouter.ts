import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit } from 'fp-ts-routing'

import { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { SummonerName } from '../../shared/models/riot/SummonerName'
import { RouterUtils } from '../../shared/utils/RouterUtils'
import { StringUtils } from '../../shared/utils/StringUtils'

import { PartialGenericQuery } from '../models/genericQuery/PartialGenericQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

const { codec } = RouterUtils

/**
 * matches
 */

const sPlatformPuuidMatch = lit('s')
  .then(codec('platform', Platform.orLowerCaseCodec))
  .then(codec('puuid', Puuid.codec))
const sPlatformPuuidGameMatch = sPlatformPuuidMatch.then(lit('game'))
const platformSummonerNameMatch = codec('platform', Platform.orLowerCaseCodec).then(
  codec('summonerName', SummonerName.codec),
)
const platformSummonerNameGameMatch = platformSummonerNameMatch.then(lit('game'))
const aramMatch = lit('aram')
const factionsMatch = lit('factions')
const loginMatch = lit('login')
const registerMatch = lit('register')
const discordRedirectMatch = lit('discordRedirect')

export const appMatches = {
  sPlatformPuuid: sPlatformPuuidMatch.then(end),
  sPlatformPuuidGame: sPlatformPuuidGameMatch.then(end),
  platformSummonerName: platformSummonerNameMatch.then(end),
  platformSummonerNameGame: platformSummonerNameGameMatch.then(end),
}

/**
 * parser
 */

// don't forget .then(end).parser (or use p)
const platformSummonerName = p(platformSummonerNameMatch)
const platformSummonerNameGame = p(platformSummonerNameGameMatch)

const anyPlatformSummonerName: Parser<{
  platform: Platform
  summonerName: SummonerName
}> = platformSummonerName
  .alt(platformSummonerNameGame)
  .map(({ platform, ...a }) => ({ ...a, platform: StringUtils.toUpperCase(platform) }))

export const appParsers = {
  index: end.parser,
  sPlatformPuuid: p(sPlatformPuuidMatch),
  sPlatformPuuidGame: p(sPlatformPuuidGameMatch),
  platformSummonerName,
  platformSummonerNameGame,
  aram: p(aramMatch),
  factions: p(factionsMatch),
  login: p(loginMatch),
  register: p(registerMatch),
  discordRedirect: p(discordRedirectMatch),

  anyPlatformSummonerName,
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
  platformSummonerName: (
    platform: Platform,
    summonerName: SummonerName,
    query: PartialMasteriesQuery,
  ) =>
    withQuery(
      format(platformSummonerNameMatch.formatter, { platform, summonerName }),
      PartialMasteriesQuery,
      query,
    ),
  platformSummonerNameGame: (platform: Platform, summonerName: SummonerName) =>
    format(platformSummonerNameGameMatch.formatter, { platform, summonerName }),
  aram: (query: PartialGenericQuery) =>
    withQuery(format(aramMatch.formatter, {}), PartialGenericQuery, query),
  factions: (query: PartialGenericQuery) =>
    withQuery(format(factionsMatch.formatter, {}), PartialGenericQuery, query),
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
