import { refinement } from 'fp-ts'
import type { Refinement } from 'fp-ts/Refinement'
import { identity, pipe } from 'fp-ts/function'

import type { LeagueMiniSeriesProgress } from '../../../shared/models/api/league/LeagueMiniSeriesProgress'
import type { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import type { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import type { LeagueId } from '../riot/LeagueId'
import type { RiotLeagueEntry } from '../riot/RiotLeagueEntry'

type Common = {
  leaguePoints: number
  wins: number
  losses: number
  veteran: boolean
  inactive: boolean
  freshBlood: boolean
  hotStreak: boolean
}

type LeagueEntryCherry = Common & {
  type: 'cherry'
}

type LeagueEntryRanked = Common & {
  type: 'ranked'
  leagueId: LeagueId
  queueType: string
  tier: LeagueTier
  rank: LeagueRank
  miniSeriesProgress: Maybe<NonEmptyArray<LeagueMiniSeriesProgress>>
}

type LeagueEntry = LeagueEntryCherry | LeagueEntryRanked

const fromRiot: (e: RiotLeagueEntry) => LeagueEntry = identity

const isRanked = (e: LeagueEntry): e is LeagueEntryRanked => e.type === 'ranked'

const isRankedAndQueueTypeEquals = (
  queueType: string,
): Refinement<LeagueEntry, LeagueEntryRanked> =>
  pipe(
    isRanked,
    refinement.compose((e: LeagueEntryRanked): e is LeagueEntryRanked => e.queueType === queueType),
  )

const LeagueEntry = { fromRiot, isRankedAndQueueTypeEquals }

export { LeagueEntry, LeagueEntryRanked }
