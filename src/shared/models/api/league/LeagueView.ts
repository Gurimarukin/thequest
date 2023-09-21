import * as C from 'io-ts/Codec'

import { Maybe, NonEmptyArray } from '../../../utils/fp'
import { LeagueMiniSeriesProgress } from './LeagueMiniSeriesProgress'
import { LeagueRank } from './LeagueRank'
import { LeagueTier } from './LeagueTier'

type LeagueView = C.TypeOf<typeof codec>

const codec = C.struct({
  currentSplit: Maybe.codec(
    C.struct({
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
      leaguePoints: C.number,
      wins: C.number,
      losses: C.number,
      miniSeriesProgress: Maybe.codec(NonEmptyArray.codec(LeagueMiniSeriesProgress.codec)),
    }),
  ),

  // poro
  previousSplit: Maybe.codec(
    C.struct({
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
    }),
  ),
})

const LeagueView = { codec }

export { LeagueView }
