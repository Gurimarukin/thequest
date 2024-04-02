import { string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { LeagueMiniSeriesProgress } from '../../../shared/models/api/league/LeagueMiniSeriesProgress'
import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { LeagueId } from './LeagueId'

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

type RiotLeagueEntryRanked = D.TypeOf<typeof rankedDecoder>

const rankedDecoder = pipe(
  commonDecoder,
  D.intersect(
    D.struct({
      leagueId: LeagueId.codec,
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
  | ({ type: 'ranked' } & Omit<RiotLeagueEntryRanked, 'miniSeries'> & {
        miniSeriesProgress: Maybe<NonEmptyArray<LeagueMiniSeriesProgress>>
      })

const decoder: Decoder<unknown, RiotLeagueEntry> = pipe(
  D.union(cherryDecoder, rankedDecoder),
  D.map((e): RiotLeagueEntry => {
    if (isCherry(e)) {
      const {
        queueType: {},
        ...attrs
      } = e
      return { type: 'cherry', ...attrs }
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

const isCherry = (e: RiotLeagueEntryCherry | RiotLeagueEntryRanked): e is RiotLeagueEntryCherry =>
  e.queueType === CHERRY

const RiotLeagueEntry = { decoder }

export { RiotLeagueEntry }
