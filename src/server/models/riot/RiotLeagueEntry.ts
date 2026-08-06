import { string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { LeagueMiniSeriesProgress } from '../../../shared/models/api/league/LeagueMiniSeriesProgress'
import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

const commonDecoder = D.struct({
  leaguePoints: D.number,
  wins: D.number,
  losses: D.number,
  veteran: D.boolean,
  inactive: D.boolean,
  freshBlood: D.boolean,
  hotStreak: D.boolean,
})

const CHERRY = 'CHERRY'

type RiotLeagueEntryCherry = D.TypeOf<typeof cherryDecoder>

const cherryDecoder = pipe(
  commonDecoder,
  D.intersect(
    D.struct({
      queueType: D.literal(CHERRY),
    }),
  ),
)

/** League Classic */

const JADE_RANKED_SOLO_5x5 = 'JADE_RANKED_SOLO_5x5'

type RiotLeagueEntryJade = D.TypeOf<typeof jadeDecoder>

const jadeDecoder = pipe(
  commonDecoder,
  D.intersect(
    D.struct({
      queueType: D.literal(JADE_RANKED_SOLO_5x5),
    }),
  ),
)

type RiotLeagueEntryRanked = D.TypeOf<typeof rankedDecoder>

const rankedDecoder = pipe(
  commonDecoder,
  D.intersect(
    D.struct({
      queueType: D.string,
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
      miniSeries: Maybe.decoder(
        D.struct({
          // "target": D.number, // 2 3
          // "wins": D.number,
          // "losses": D.number,
          progress: pipe(
            D.string,
            D.map(string.split('')),
            D.compose(NonEmptyArray.decoder(LeagueMiniSeriesProgress.decoder)),
          ), // "LNN"
        }),
      ),
    }),
  ),
)

type RiotLeagueEntry =
  | ({ type: 'cherry' } & Omit<RiotLeagueEntryCherry, 'queueType'>)
  | ({ type: 'jade' } & Omit<RiotLeagueEntryJade, 'queueType'>)
  | ({ type: 'ranked' } & Omit<RiotLeagueEntryRanked, 'miniSeries'> & {
        miniSeriesProgress: Maybe<NonEmptyArray<LeagueMiniSeriesProgress>>
      })

const decoder: Decoder<unknown, RiotLeagueEntry> = pipe(
  D.union(cherryDecoder, jadeDecoder, rankedDecoder),
  D.map((e): RiotLeagueEntry => {
    if (isCherry(e)) {
      const {
        queueType: {},
        ...attrs
      } = e
      return { type: 'cherry', ...attrs }
    }

    if (isJade(e)) {
      const {
        queueType: {},
        ...attrs
      } = e
      return { type: 'jade', ...attrs }
    }

    const { miniSeries, ...attrs } = e
    return {
      type: 'ranked',
      ...attrs,
      miniSeriesProgress: pipe(
        miniSeries,
        Maybe.map(s => s.progress),
      ),
    }
  }),
)

type RiotLeagueEntryRaw = RiotLeagueEntryCherry | RiotLeagueEntryJade | RiotLeagueEntryRanked

function isCherry(e: RiotLeagueEntryRaw): e is RiotLeagueEntryCherry {
  return e.queueType === CHERRY
}

function isJade(e: RiotLeagueEntryRaw): e is RiotLeagueEntryJade {
  return e.queueType === JADE_RANKED_SOLO_5x5
}

const RiotLeagueEntry = { decoder }

export { RiotLeagueEntry }
