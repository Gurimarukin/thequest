import { string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { LeagueMiniSeriesProgress } from '../../../shared/models/api/league/LeagueMiniSeriesProgress'
import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

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
  miniSeries: Maybe.decoder(
    D.struct({
      // "target": D.number, // 2 3
      // "wins": D.number,
      // "losses": D.number,
      progress: pipe(
        D.string,
        D.map(string.split('')),
        D.compose(NonEmptyArray.decoder(LeagueMiniSeriesProgress.decoder)),
      ), // "LNN"
    }),
  ),
})

const RiotLeagueEntry = { decoder }

export { RiotLeagueEntry }
