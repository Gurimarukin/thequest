import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import { ChampionKey } from '../champion/ChampionKey'
import { CurrentGameParticipantView } from './CurrentGameParticipantView'
import { GameId } from './GameId'
import { GameQueue } from './GameQueue'
import { TeamId } from './TeamId'

type CurrentGameInfoView = C.TypeOf<typeof codec>

const codec = C.struct({
  gameId: GameId.codec,
  gameStartTime: DayJsFromISOString.codec,
  gameQueueConfigId: GameQueue.codec,
  bannedChampions: List.codec(
    C.struct({
      pickTurn: C.number,
      championId: ChampionKey.codec,
      teamId: TeamId.codec,
    }),
  ),
  participants: List.codec(CurrentGameParticipantView.codec),
})

const CurrentGameInfoView = { codec }

export { CurrentGameInfoView }
