import * as D from 'io-ts/Decoder'

import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'

import { LeagueId } from './LeagueId'

type RiotLeagueEntry = D.TypeOf<typeof decoder>

const decoder = D.struct({
  leagueId: LeagueId.codec,
  queueType: D.string,
  tier: LeagueTier.codec,
  rank: LeagueRank.codec,
  // summonerId: SummonerId.codec,
  // summonerName: D.string,
  leaguePoints: D.number,
  wins: D.number,
  losses: D.number,
  veteran: D.boolean,
  inactive: D.boolean,
  freshBlood: D.boolean,
  hotStreak: D.boolean,
})

const RiotLeagueEntry = { decoder }

export { RiotLeagueEntry }
