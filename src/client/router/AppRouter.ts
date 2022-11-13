import { end, format, lit, str } from 'fp-ts-routing'

import { Platform } from '../../shared/models/Platform'
import { RouterUtils } from '../../shared/utils/RouterUtils'

const { codec } = RouterUtils

/**
 * matches
 */

const summonerPlatformSummonerNameMatch = lit('summoner')
  .then(codec('platform', Platform.codec))
  .then(str('summonerName'))

/**
 * parser
 */

// don't forget .then(end).parser
export const appParsers = {
  index: end.parser,
  summonerPlatformSummonerName: summonerPlatformSummonerNameMatch.then(end).parser,
}

/**
 * routes
 */

export const appRoutes = {
  index: format(end.formatter, {}),
  summonerPlatformSummonerName: (platform: Platform, summonerName: string) =>
    format(summonerPlatformSummonerNameMatch.formatter, { platform, summonerName }),
}
