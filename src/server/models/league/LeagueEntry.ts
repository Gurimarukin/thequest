import type { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../../shared/models/api/league/LeagueTier'

import type { LeagueId } from '../riot/LeagueId'

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
}

export { LeagueEntry }
