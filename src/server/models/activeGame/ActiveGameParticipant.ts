import type { ActiveGameMasteryView } from '../../../shared/models/api/activeGame/ActiveGameMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import type { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { List, Maybe } from '../../../shared/utils/fp'

import type { SummonerId } from '../summoner/SummonerId'

type ActiveGameParticipant = {
  teamId: TeamId
  summonerId: SummonerId
  summonerName: string
  profileIconId: number
  championId: ChampionKey
  spell1Id: number
  spell2Id: number
  perks: {
    perkIds: List<number>
    perkStyle: number
    perkSubStyle: number
  }
}

type ToView = {
  totalMasteryScore: number
  mastery: Maybe<ActiveGameMasteryView>
  shardsCount: number
}

const toView =
  ({ totalMasteryScore, mastery, shardsCount }: ToView) =>
  (p: ActiveGameParticipant): ActiveGameParticipantView => ({
    ...p,
    totalMasteryScore,
    mastery,
    shardsCount,
  })

const ActiveGameParticipant = { toView }

export { ActiveGameParticipant }
