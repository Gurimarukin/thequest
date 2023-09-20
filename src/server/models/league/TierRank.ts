import type { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../../shared/models/api/league/LeagueTier'

export type TierRank = {
  tier: LeagueTier
  rank: LeagueRank
}
