import { end, format, lit, str } from 'fp-ts-routing'

import { Platform } from '../../shared/models/api/Platform'
import { RouterUtils } from '../../shared/utils/RouterUtils'

import { PartialAramQuery } from '../models/aramQuery/PartialAramQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

const { codec } = RouterUtils

/**
 * matches
 */

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
  platformSummonerName: platformSummonerNameMatch.then(end).parser,
  aram: aramMatch.then(end).parser,
  login: loginMatch.then(end).parser,
  register: registerMatch.then(end).parser,
  discordRedirect: discordRedirectMatch.then(end).parser,
}

/**
 * routes
 */

export const appRoutes = {
  index: format(end.formatter, {}),
  platformSummonerName: (platform: Platform, summonerName: string, query: PartialMasteriesQuery) =>
    `${format(platformSummonerNameMatch.formatter, { platform, summonerName })}${q(
      PartialMasteriesQuery.qsStringify(query),
    )}`,
  aram: (query: PartialAramQuery) =>
    `${format(aramMatch.formatter, {})}${q(PartialAramQuery.qsStringify(query))}`,
  login: format(loginMatch.formatter, {}),
  register: format(registerMatch.formatter, {}),
}

const q = (query: string): string => (query === '' ? '' : `?${query}`)
