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
const platformSummonerNameMatch = codec('platform', Platform.codec).then(str('summonerName'))
const aramMatch = lit('aram')
const loginMatch = lit('login')
const registerMatch = lit('register')
const discordRedirectMatch = lit('discordRedirect')

/**
 * parser
 */

// don't forget .then(end).parser
export const appParsers = {
  index: end.parser,
  sPlatformPuuid: p(sPlatformPuuidMatch),
  platformSummonerName: p(platformSummonerNameMatch),
  aram: p(aramMatch),
  login: p(loginMatch),
  register: p(registerMatch),
  discordRedirect: p(discordRedirectMatch),
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
  platformSummonerName: (platform: Platform, summonerName: string, query: PartialMasteriesQuery) =>
    withQuery(
      format(platformSummonerNameMatch.formatter, { platform, summonerName }),
      PartialMasteriesQuery,
      query,
    ),
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
