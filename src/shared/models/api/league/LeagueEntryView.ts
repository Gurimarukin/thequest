import * as C from 'io-ts/Codec'

import { LeagueRank } from './LeagueRank'
import { LeagueTier } from './LeagueTier'

type LeagueEntryView = C.TypeOf<typeof codec>

const codec = C.struct({
  tier: LeagueTier.codec,
  rank: LeagueRank.codec,
  leaguePoints: C.number,
  wins: C.number,
  losses: C.number,
})

const LeagueEntryView = { codec }

export { LeagueEntryView }
