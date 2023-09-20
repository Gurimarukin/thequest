import * as C from 'io-ts/Codec'

import { Maybe, NonEmptyArray } from '../../../utils/fp'
import { LeagueMiniSeriesProgress } from './LeagueMiniSeriesProgress'
import { LeagueRank } from './LeagueRank'
import { LeagueTier } from './LeagueTier'

type LeagueEntryView = C.TypeOf<typeof codec>

const codec = C.struct({
  tier: LeagueTier.codec,
  rank: LeagueRank.codec,
  leaguePoints: C.number,
  wins: C.number,
  losses: C.number,
  miniSeriesProgress: Maybe.codec(NonEmptyArray.codec(LeagueMiniSeriesProgress.codec)),

  // poro
  previousSeason: Maybe.codec(
    C.struct({
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
    }),
  ),
})

const LeagueEntryView = { codec }

export { LeagueEntryView }
