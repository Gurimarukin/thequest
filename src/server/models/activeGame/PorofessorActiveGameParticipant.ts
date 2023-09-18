import type { ActiveGameMasteriesView } from '../../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { Maybe } from '../../../shared/utils/fp'

import { PorofessorLeagues } from '../league/PorofessorLeagues'
import type { ActiveGameParticipant } from './ActiveGameParticipant'

type PorofessorActiveGameParticipant = {
  summonerName: string
  leagues: PorofessorLeagues
}

type ToView = {
  participant: ActiveGameParticipant
  masteries: Maybe<ActiveGameMasteriesView>
  shardsCount: Maybe<number>
}

const toView =
  ({ participant, masteries, shardsCount }: ToView) =>
  (porofessorParticipant: PorofessorActiveGameParticipant): ActiveGameParticipantView => ({
    summonerName: porofessorParticipant.summonerName,
    profileIconId: participant.profileIconId,
    leagues: Maybe.some(PorofessorLeagues.toView(porofessorParticipant.leagues)),
    championId: participant.championId,
    bannedChampion: participant.bannedChampion,
    masteries,
    shardsCount,
    spell1Id: participant.spell1Id,
    spell2Id: participant.spell2Id,
    perks: participant.perks,
  })

const PorofessorActiveGameParticipant = { toView }

export { PorofessorActiveGameParticipant }
