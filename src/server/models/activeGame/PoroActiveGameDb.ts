import * as C from 'io-ts/Codec'

import { GameId } from '../../../shared/models/api/GameId'
import { Lang } from '../../../shared/models/api/Lang'
import { PoroNiceness } from '../../../shared/models/api/activeGame/PoroNiceness'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { List, Maybe } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'

const poroLeagueCodec = C.struct({
  currentSplit: Maybe.codec(
    C.struct({
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
      leaguePoints: C.number,
      winRate: C.struct({
        percents: C.number,
        played: C.number,
      }),
    }),
  ),
  previousSplit: Maybe.codec(
    C.struct({
      tier: LeagueTier.codec,
      rank: LeagueRank.codec,
    }),
  ),
})

const participantCodec = C.struct({
  premadeId: Maybe.codec(C.number),
  riotId: RiotId.fromStringCodec,
  summonerLevel: C.number,
  champion: Maybe.codec(
    C.struct({
      percents: C.number,
      played: C.number,
      kills: C.number,
      deaths: C.number,
      assists: C.number,
    }),
  ),
  leagues: C.struct({
    soloDuo: poroLeagueCodec,
    flex: poroLeagueCodec,
  }),
  role: Maybe.codec(ChampionPosition.codec),
  mainRoles: List.codec(ChampionPosition.codec),
  tags: List.codec(
    C.struct({
      niceness: PoroNiceness.codec,
      label: C.string,
      tooltip: C.string,
    }),
  ),
})

type PoroActiveGameDb = C.TypeOf<typeof codec>

const codec = C.struct({
  lang: Lang.codec,
  gameId: GameId.codec,
  participants: List.codec(participantCodec),
  insertedAt: DayJsFromDate.codec,
})

const PoroActiveGameDb = { codec }

export { PoroActiveGameDb }
