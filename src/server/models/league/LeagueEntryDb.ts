import * as C from 'io-ts/Codec'

import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { List } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { LeagueId } from '../riot/LeagueId'
import { SummonerId } from '../summoner/SummonerId'

type LeagueEntryDb = C.TypeOf<typeof codec>

const codec = C.struct({
  summonerId: SummonerId.codec,
  entries: List.codec(
    C.struct({
      leagueId: LeagueId.codec,
      queueType: C.string,
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
      leaguePoints: C.number,
      wins: C.number,
      losses: C.number,
      veteran: C.boolean,
      inactive: C.boolean,
      freshBlood: C.boolean,
      hotStreak: C.boolean,
    }),
  ),
  insertedAt: DayJsFromDate.codec,
})

const LeagueEntryDb = { codec }

export { LeagueEntryDb }