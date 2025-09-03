import type { DayJs } from '../../../shared/models/DayJs'
import type { GameId } from '../../../shared/models/api/GameId'
import type { MapId } from '../../../shared/models/api/MapId'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import type { BannedChampion } from '../../../shared/models/api/activeGame/BannedChampion'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import type { ActiveGameParticipant } from './ActiveGameParticipant'

type ActiveGame = {
  gameId: GameId
  gameStartTime: Maybe<DayJs>
  mapId: MapId
  /** GameMode */
  gameMode: string
  /** GameQueue */
  gameQueueConfigId: number
  isDraft: boolean
  bannedChampions: PartialDict<`${TeamId}`, NonEmptyArray<BannedChampion>>
  participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipant>>
  insertedAt: DayJs
}

const toView =
  (
    participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipantView>>,
    isPoroOK: boolean,
  ) =>
  (game: ActiveGame): ActiveGameView => ({
    ...game,
    participants,
    isPoroOK,
  })

const ActiveGame = { toView }

export { ActiveGame }
