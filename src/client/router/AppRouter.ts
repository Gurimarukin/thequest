import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit, str } from 'fp-ts-routing'

import { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { RouterUtils } from '../../shared/utils/RouterUtils'

import { PartialAramQuery } from '../models/aramQuery/PartialAramQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

const { codec } = RouterUtils

/**
 * matches
 */

const sPlatformPuuidMatch = lit('s')
  .then(codec('platform', Platform.codec))
  .then(codec('puuid', Puuid.codec))
const sPlatformPuuidGameMatch = sPlatformPuuidMatch.then(lit('game'))
const platformSummonerNameMatch = codec('platform', Platform.codec).then(str('summonerName'))
const platformSummonerNameGameMatch = platformSummonerNameMatch.then(lit('game'))
const aramMatch = lit('aram')
const loginMatch = lit('login')
const registerMatch = lit('register')
const discordRedirectMatch = lit('discordRedirect')

/**
 * parser
 */

// don't forget .then(end).parser (p)
const platformSummonerName = p(platformSummonerNameMatch)
const platformSummonerNameGame = p(platformSummonerNameGameMatch)

const anyPlatformSummonerName: Parser<{
  platform: Platform
  summonerName: string
}> = platformSummonerName.alt(platformSummonerNameGame)

export const appParsers = {
  index: end.parser,
  sPlatformPuuid: p(sPlatformPuuidMatch),
  sPlatformPuuidGame: p(sPlatformPuuidGameMatch),
  platformSummonerName,
  platformSummonerNameGame,
  aram: p(aramMatch),
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
  platformSummonerName: (platform: Platform, summonerName: string, query: PartialMasteriesQuery) =>
    withQuery(
      format(platformSummonerNameMatch.formatter, { platform, summonerName }),
      PartialMasteriesQuery,
      query,
    ),
  platformSummonerNameGame: (platform: Platform, summonerName: string) =>
    format(platformSummonerNameGameMatch.formatter, { platform, summonerName }),
  aram: (query: PartialAramQuery) =>
    withQuery(format(aramMatch.formatter, {}), PartialAramQuery, query),
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
