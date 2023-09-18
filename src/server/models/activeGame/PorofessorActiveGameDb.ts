import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { Dict } from '../../../shared/utils/fp'
import { NonEmptyArray } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { GameId } from '../riot/GameId'

type Participant = C.TypeOf<typeof participantCodec>
type ParticipantOutput = C.OutputOf<typeof participantCodec>

const participantCodec = C.struct({
  // summonerId: SummonerId.codec,
  summonerName: C.string,
  // profileIconId: C.number,
  // championId: ChampionKey.codec,
  // bannedChampion: BannedChampion.codec,
  // spell1Id: SummonerSpellKey.codec,
  // spell2Id: SummonerSpellKey.codec,
  // perks: C.struct({
  //   perkIds: List.codec(RuneId.codec),
  //   perkStyle: RuneStyleId.codec,
  //   perkSubStyle: RuneStyleId.codec,
  // }),
  leagues: C.struct({}),
})

const participantsProperties: Dict<
  `${TeamId}`,
  Codec<unknown, NonEmptyArray<ParticipantOutput>, NonEmptyArray<Participant>>
> = {
  100: NonEmptyArray.codec(participantCodec),
  200: NonEmptyArray.codec(participantCodec),
}

type PorofessorActiveGameDb = C.TypeOf<typeof codec>

const codec = C.struct({
  gameId: GameId.codec,
  // mapId: MapId.codec,
  // gameStartTime: Maybe.codec(DayJsFromDate.codec),
  // gameQueueConfigId: GameQueue.codec,
  // isDraft: C.boolean,
  participants: C.readonly(C.partial(participantsProperties)),
  insertedAt: DayJsFromDate.codec,
  // updatedAt: DayJsFromDate.codec,
})

const PorofessorActiveGameDb = { codec }

export { PorofessorActiveGameDb }
