import type { Maybe } from '../../../shared/utils/fp'

import type { TierRank } from './TierRank'
import type { WinRate } from './WinRate'

export type PoroLeague = TierRank & {
  leaguePoints: number
  winRate: WinRate
  previousSeason: Maybe<TierRank>
}
