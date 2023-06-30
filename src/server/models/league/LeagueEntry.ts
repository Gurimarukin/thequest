import { pipe } from 'fp-ts/function'

import type { LeagueMiniSeriesProgress } from '../../../shared/models/api/league/LeagueMiniSeriesProgress'
import type { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import type { NonEmptyArray } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import type { LeagueId } from '../riot/LeagueId'
import type { RiotLeagueEntry } from '../riot/RiotLeagueEntry'

type LeagueEntry = {
  leagueId: LeagueId
  queueType: string
  tier: LeagueTier
  rank: LeagueRank
  leaguePoints: number
  wins: number
  losses: number
  veteran: boolean
  inactive: boolean
  freshBlood: boolean
  hotStreak: boolean
  miniSeriesProgress: Maybe<NonEmptyArray<LeagueMiniSeriesProgress>>
}

const fromRiot = ({ miniSeries, ...e }: RiotLeagueEntry): LeagueEntry => ({
  ...e,
  miniSeriesProgress: pipe(
    miniSeries,
    Maybe.map(s => s.progress),
  ),
})

const LeagueEntry = { fromRiot }

export { LeagueEntry }
