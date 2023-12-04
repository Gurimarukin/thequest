import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit } from 'fp-ts-routing'
import { flow, pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'

import { Platform } from '../../shared/models/api/Platform'
import type { PlatformWithRiotId } from '../../shared/models/api/summoner/PlatformWithRiotId'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { RiotId } from '../../shared/models/riot/RiotId'
import { SummonerName } from '../../shared/models/riot/SummonerName'
import { RouterUtils } from '../../shared/utils/RouterUtils'
import { StringUtils } from '../../shared/utils/StringUtils'
import { Either, Maybe } from '../../shared/utils/fp'

import { PartialGenericQuery } from '../models/genericQuery/PartialGenericQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'
import type { PlatformWithSummoner } from '../models/summoner/PlatformWithSummoner'

const { codec } = RouterUtils

const riotIdRegex = /^(.+)-([^-]+)$/

export const riotIdUrlCodec: Codec<unknown, string, RiotId> = C.make(
  pipe(
    D.string,
    D.parse(str =>
      pipe(
        str,
        StringUtils.matcher2(riotIdRegex),
        Maybe.fold(() => D.failure(str, 'RiotIdUrl'), flow(RiotId.fromRawTuple, D.success)),
      ),
    ),
  ),
  pipe(
    E.id<string>(),
    E.contramap(({ gameName, tagLine }: RiotId) => `${gameName}-${tagLine}`),
  ),
)

/**
 * matches
 */

const platformM = codec('platform', Platform.orLowerCaseCodec)

const sPlatformPuuidMatch = lit('s').then(platformM).then(codec('puuid', Puuid.codec))
const sPlatformPuuidGameMatch = sPlatformPuuidMatch.then(lit('game'))

const platformRiotIdMatch = platformM.then(codec('riotId', riotIdUrlCodec))
const platformRiotIdGameMatch = platformRiotIdMatch.then(lit('game'))

const platformSummonerNameMatch = platformM.then(codec('summonerName', SummonerName.codec))
const platformSummonerNameGameMatch = platformSummonerNameMatch.then(lit('game'))

const aramMatch = lit('aram')
const factionsMatch = lit('factions')
const loginMatch = lit('login')
const registerMatch = lit('register')
const discordRedirectMatch = lit('discordRedirect')

export const appMatches = {
  sPlatformPuuid: sPlatformPuuidMatch.then(end),
  sPlatformPuuidGame: sPlatformPuuidGameMatch.then(end),

  platformRiotId: platformRiotIdMatch.then(end),
  platformRiotIdGame: platformRiotIdGameMatch.then(end),

  /**
   * @deprecated
   */
  // eslint-disable-next-line deprecation/deprecation
  platformSummonerName: platformSummonerNameMatch.then(end),
  /**
   * @deprecated
   */
  // eslint-disable-next-line deprecation/deprecation
  platformSummonerNameGame: platformSummonerNameGameMatch.then(end),
}

/**
 * parsers
 *
 * Don't forget .then(end).parser (or use p)
 */

const platformRiotId = p(platformRiotIdMatch)
const platformRiotIdGame = p(platformRiotIdGameMatch)

const platformSummonerName = p(platformSummonerNameMatch)
const platformSummonerNameGame = p(platformSummonerNameGameMatch)

const anyPlatformRiotId: Parser<PlatformWithRiotId> = platformRiotId
  .alt(platformRiotIdGame)
  .map(({ platform, riotId }) => ({
    platform: StringUtils.toUpperCase(platform),
    riotId,
  }))

const anyPlatformSummoner: Parser<PlatformWithSummoner> =
  // Right<RiotId>
  anyPlatformRiotId
    .map(
      ({ platform, riotId }): PlatformWithSummoner => ({
        platform,
        summoner: Either.right(riotId),
      }),
    )
    // Left<SummonerName>
    .alt(
      platformSummonerName.alt(platformSummonerNameGame).map(
        ({ platform, summonerName }): PlatformWithSummoner => ({
          platform: StringUtils.toUpperCase(platform),
          summoner: Either.left(summonerName),
        }),
      ),
    )

export const appParsers = {
  index: end.parser,

  sPlatformPuuid: p(sPlatformPuuidMatch),
  sPlatformPuuidGame: p(sPlatformPuuidGameMatch),

  platformRiotId,
  platformRiotIdGame,

  /**
   * @deprecated
   */
  // eslint-disable-next-line deprecation/deprecation
  platformSummonerName,
  /**
   * @deprecated
   */
  // eslint-disable-next-line deprecation/deprecation
  platformSummonerNameGame,

  aram: p(aramMatch),
  factions: p(factionsMatch),
  login: p(loginMatch),
  register: p(registerMatch),
  discordRedirect: p(discordRedirectMatch),

  anyPlatformRiotId,
  anyPlatformSummoner,
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

  /**
   * @deprecated
   */
  // eslint-disable-next-line deprecation/deprecation
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
  /**
   * @deprecated
   */
  // eslint-disable-next-line deprecation/deprecation
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
