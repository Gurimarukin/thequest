import type { LeagueEntryView } from '../../../shared/models/api/league/LeagueEntryView'
import { Maybe } from '../../../shared/utils/fp'

import type { TierRank } from './TierRank'
import { WinRate } from './WinRate'

type PoroLeague = TierRank & {
  leaguePoints: number
  winRate: WinRate
  previousSeason: Maybe<TierRank>
}

const toView = (league: PoroLeague): LeagueEntryView => ({
  tier: league.tier,
  rank: league.rank,
  leaguePoints: league.leaguePoints,
  ...WinRate.toWinsLosses(league.winRate),
  miniSeriesProgress: Maybe.none,

  previousSeason: league.previousSeason,
})

const PoroLeague = { toView }

export { PoroLeague }
