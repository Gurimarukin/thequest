import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'

import { GameId } from '../../../shared/models/api/GameId'
import type { BannedChampionOutput } from '../../../shared/models/api/activeGame/BannedChampion'
import { BannedChampion } from '../../../shared/models/api/activeGame/BannedChampion'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { RuneId } from '../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { RiotId } from '../../../shared/models/riot/RiotId'
import type { Dict } from '../../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'

export type ActiveGameParticipantDb = D.TypeOf<typeof participantDecoder>
type ActiveGameParticipantPbOutput = E.OutputOf<typeof participantEncoder>

const participantStreamer = C.struct({
  puuid: C.literal(null),
  // riotId: D.string, // champion name
})

const participantVisible = C.struct({
  puuid: Puuid.codec,
  riotId: RiotId.fromStringCodec,
})

const participantCommon = C.struct({
  profileIconId: C.number,
  championId: ChampionKey.codec,
  spell1Id: SummonerSpellKey.codec,
  spell2Id: SummonerSpellKey.codec,
  perks: Maybe.codec(
    C.struct({
      perkIds: List.codec(RuneId.codec),
      perkStyle: RuneStyleId.codec,
      perkSubStyle: RuneStyleId.codec,
    }),
  ),
})

const participantDecoder = pipe(
  D.union(participantStreamer, participantVisible),
  D.intersect(participantCommon),
)

const participantEncoder = {
  encode: (p: ActiveGameParticipantDb) =>
    p.puuid === null
      ? pipe(participantStreamer, E.intersect(participantCommon)).encode(p)
      : pipe(participantVisible, E.intersect(participantCommon)).encode(p),
}

const participantCodec = C.make(participantDecoder, participantEncoder)

type ActiveGameDb = C.TypeOf<typeof codec>

const bannedChampionsProperties: Dict<
  `${TeamId}`,
  Codec<unknown, NonEmptyArray<BannedChampionOutput>, NonEmptyArray<BannedChampion>>
> = {
  100: NonEmptyArray.codec(BannedChampion.codec),
  200: NonEmptyArray.codec(BannedChampion.codec),
}

const participantsProperties: Dict<
  `${TeamId}`,
  Codec<
    unknown,
    NonEmptyArray<ActiveGameParticipantPbOutput>,
    NonEmptyArray<ActiveGameParticipantDb>
  >
> = {
  100: NonEmptyArray.codec(participantCodec),
  200: NonEmptyArray.codec(participantCodec),
}

const codec = C.struct({
  gameId: GameId.codec,
  /** MapId */
  mapId: C.number,
  /** GameMode */
  gameMode: C.string,
  gameStartTime: Maybe.codec(DayJsFromDate.codec),
  /** GameQueue */
  gameQueueConfigId: C.number,
  isDraft: C.boolean,
  bannedChampions: C.readonly(C.partial(bannedChampionsProperties)),
  participants: C.readonly(C.partial(participantsProperties)),
  insertedAt: DayJsFromDate.codec,
  updatedAt: DayJsFromDate.codec,
})

const ActiveGameDb = { codec }

export { ActiveGameDb }
