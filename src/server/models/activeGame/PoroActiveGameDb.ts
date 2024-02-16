import { flow, pipe } from 'fp-ts/function'
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
import { Dict, List, Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

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

const rawParticipantsCodec = Maybe.codec(NonEmptyArray.codec(participantCodec))

const maybeParticipantsProperties: Dict<`${TeamId}`, typeof rawParticipantsCodec> = {
  100: rawParticipantsCodec,
  200: rawParticipantsCodec,
}

const maybeParticipantsCodec = C.struct(maybeParticipantsProperties)

const participants: Codec<
  unknown,
  C.OutputOf<typeof maybeParticipantsCodec>,
  PartialDict<`${TeamId}`, NonEmptyArray<Participant>>
> = pipe(
  maybeParticipantsCodec,
  C.imap(
    flow(
      Dict.toReadonlyArray,
      List.reduce(PartialDict.empty(), (acc, [teamId, ps]) =>
        pipe(
          ps,
          Maybe.fold(
            () => acc,
            p => ({ ...acc, [teamId]: p }),
          ),
        ),
      ),
    ),
    partial => ({
      100: Maybe.fromNullable(partial[100]),
      200: Maybe.fromNullable(partial[200]),
    }),
  ),
)

type PoroActiveGameDb = C.TypeOf<typeof codec>

const codec = C.struct({
  lang: Lang.codec,
  gameId: GameId.codec,
  participants,
  insertedAt: DayJsFromDate.codec,
})

const PoroActiveGameDb = { codec }

export { PoroActiveGameDb }
