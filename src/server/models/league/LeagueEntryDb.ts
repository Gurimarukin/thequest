import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { LeagueMiniSeriesProgress } from '../../../shared/models/api/league/LeagueMiniSeriesProgress'
import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { LeagueId } from '../riot/LeagueId'
import { SummonerId } from '../summoner/SummonerId'

const commonCodec = C.struct({
  leaguePoints: C.number,
  wins: C.number,
  losses: C.number,
  veteran: C.boolean,
  inactive: C.boolean,
  freshBlood: C.boolean,
  hotStreak: C.boolean,
})

const leagueEntryCodec = pipe(
  commonCodec,
  C.intersect(
    C.sum('type')({
      cherry: C.struct({
        type: C.literal('cherry'),
      }),
      ranked: C.struct({
        type: C.literal('ranked'),
        leagueId: LeagueId.codec,
        queueType: C.string,
        tier: LeagueTier.codec,
        rank: LeagueRank.codec,
        miniSeriesProgress: Maybe.codec(NonEmptyArray.codec(LeagueMiniSeriesProgress.codec)),
      }),
    }),
  ),
)

type LeagueEntryDb = C.TypeOf<typeof codec>

const codec = C.struct({
  summonerId: SummonerId.codec,
  entries: List.codec(leagueEntryCodec),
  insertedAt: DayJsFromDate.codec,
})

const LeagueEntryDb = { codec }

export { LeagueEntryDb }
