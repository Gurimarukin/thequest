import { pipe } from 'fp-ts/function'

import type { LeagueView } from '../../../shared/models/api/league/LeagueView'
import { Maybe } from '../../../shared/utils/fp'

import type { TierRank } from './TierRank'
import { WinRate } from './WinRate'

type PoroLeague = {
  currentSplit: Maybe<
    TierRank & {
      leaguePoints: number
      winRate: WinRate
    }
  >
  previousSplit: Maybe<TierRank>
}

const toView = ({ currentSplit, previousSplit }: PoroLeague): LeagueView => ({
  currentSplit: pipe(
    currentSplit,
    Maybe.map(c => ({
      tier: c.tier,
      rank: c.rank,
      leaguePoints: c.leaguePoints,
      ...WinRate.toWinsLosses(c.winRate),
      miniSeriesProgress: Maybe.none,
    })),
  ),

  previousSplit,
})

const PoroLeague = { toView }

export { PoroLeague }
