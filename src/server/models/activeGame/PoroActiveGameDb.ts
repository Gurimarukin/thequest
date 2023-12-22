import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { GameId } from '../../../shared/models/api/GameId'
import { Lang } from '../../../shared/models/api/Lang'
import { PoroNiceness } from '../../../shared/models/api/activeGame/PoroNiceness'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { LeagueRank } from '../../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { RiotId } from '../../../shared/models/riot/RiotId'
import type { Dict } from '../../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

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

type Participant = C.TypeOf<typeof participantCodec>
type ParticipantOutput = C.OutputOf<typeof participantCodec>

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

const participantsProperties: Dict<
  `${TeamId}`,
  Codec<unknown, NonEmptyArray<ParticipantOutput>, NonEmptyArray<Participant>>
> = {
  100: NonEmptyArray.codec(participantCodec),
  200: NonEmptyArray.codec(participantCodec),
}

type PoroActiveGameDb = C.TypeOf<typeof codec>

const codec = C.struct({
  lang: Lang.codec,
  gameId: GameId.codec,
  participants: C.readonly(C.partial(participantsProperties)),
  insertedAt: DayJsFromDate.codec,
})

const PoroActiveGameDb = { codec }

export { PoroActiveGameDb }
