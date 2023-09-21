import { pipe } from 'fp-ts/function'

import type { LeagueView } from '../../../shared/models/api/league/LeagueView'
import { Maybe } from '../../../shared/utils/fp'

import type { TierRank } from './TierRank'
import { WinRate } from './WinRate'

type PoroLeague = {
  currentSeason: Maybe<
    TierRank & {
      leaguePoints: number
      winRate: WinRate
    }
  >
  previousSeason: Maybe<TierRank>
}

const toView = ({ currentSeason, previousSeason }: PoroLeague): LeagueView => ({
  currentSeason: pipe(
    currentSeason,
    Maybe.map(c => ({
      tier: c.tier,
      rank: c.rank,
      leaguePoints: c.leaguePoints,
      ...WinRate.toWinsLosses(c.winRate),
      miniSeriesProgress: Maybe.none,
    })),
  ),

  previousSeason,
})

const PoroLeague = { toView }

export { PoroLeague }
