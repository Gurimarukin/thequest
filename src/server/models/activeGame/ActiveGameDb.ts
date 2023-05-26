import * as C from 'io-ts/Codec'

import { MapId } from '../../../shared/models/api/MapId'
import { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { List } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { GameId } from '../riot/GameId'
import { SummonerId } from '../summoner/SummonerId'

type ActiveGameDb = C.TypeOf<typeof codec>

const codec = C.struct({
  gameId: GameId.codec,
  mapId: MapId.codec,
  gameStartTime: DayJsFromDate.codec,
  gameQueueConfigId: GameQueue.codec,
  bannedChampions: List.codec(
    C.struct({
      pickTurn: C.number,
      championId: ChampionKey.codec,
      teamId: TeamId.codec,
    }),
  ),
  participants: List.codec(
    C.struct({
      teamId: TeamId.codec,
      summonerId: SummonerId.codec,
      summonerName: C.string,
      profileIconId: C.number,
      championId: ChampionKey.codec,
      spell1Id: SummonerSpellKey.codec,
      spell2Id: SummonerSpellKey.codec,
      perks: C.struct({
        perkIds: List.codec(C.number),
        perkStyle: C.number,
        perkSubStyle: C.number,
      }),
    }),
  ),
  insertedAt: DayJsFromDate.codec,
})

const ActiveGameDb = { codec }

export { ActiveGameDb }
