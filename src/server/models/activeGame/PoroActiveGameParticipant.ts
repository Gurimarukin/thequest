import type { ActiveGameMasteriesView } from '../../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import { PoroLeagues } from '../league/PoroLeagues'
import type { ActiveGameParticipant } from './ActiveGameParticipant'
import type { PoroActiveGameParticipantChampion } from './PoroActiveGameParticipantChampion'
import type { PoroTag } from './PoroTag'

type PoroActiveGameParticipant = {
  premadeId: Maybe<number>
  summonerName: string
  summonerLevel: number
  champion: Maybe<PoroActiveGameParticipantChampion>
  leagues: PoroLeagues
  role: Maybe<ChampionPosition>
  mainRoles: List<ChampionPosition>
  tags: List<PoroTag>
}

type ToView = {
  participant: ActiveGameParticipant
  masteries: Maybe<ActiveGameMasteriesView>
  shardsCount: Maybe<number>
}

const toView =
  ({ participant, masteries, shardsCount }: ToView) =>
  (poroParticipant: PoroActiveGameParticipant): ActiveGameParticipantView => ({
    summonerName: poroParticipant.summonerName,
    profileIconId: participant.profileIconId,
    leagues: Maybe.some(PoroLeagues.toView(poroParticipant.leagues)),
    championId: participant.championId,
    bannedChampion: participant.bannedChampion,
    masteries,
    shardsCount,
    spell1Id: participant.spell1Id,
    spell2Id: participant.spell2Id,
    perks: participant.perks,
  })

const PoroActiveGameParticipant = { toView }

export { PoroActiveGameParticipant }
