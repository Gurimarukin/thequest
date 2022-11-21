import { end, format, str } from 'fp-ts-routing'

import { Platform } from '../../shared/models/api/Platform'
import { RouterUtils } from '../../shared/utils/RouterUtils'

import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

const { codec } = RouterUtils

/**
 * matches
 */

const platformSummonerNameMatch = codec('platform', Platform.codec).then(str('summonerName'))

/**
 * parser
 */

// don't forget .then(end).parser
export const appParsers = {
  index: end.parser,
  platformSummonerName: platformSummonerNameMatch.then(end).parser,
}

/**
 * routes
 */

export const appRoutes = {
  index: format(end.formatter, {}),
  platformSummonerName: (
    platform: Platform,
    summonerName: string,
    query: PartialMasteriesQuery,
  ) => {
    const q = PartialMasteriesQuery.qsStringify(query)
    return `${format(platformSummonerNameMatch.formatter, { platform, summonerName })}${
      q === '' ? '' : `?${q}`
    }`
  },
}
