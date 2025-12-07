import { pipe } from 'fp-ts/function'

import type { ActiveGameMasteriesView } from '../../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { PoroTag } from '../../../shared/models/api/activeGame/PoroTag'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { RiotId } from '../../../shared/models/riot/RiotId'
import type { List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import { PoroLeagues } from '../league/PoroLeagues'
import { WinRate } from '../league/WinRate'
import type { ActiveGameParticipant } from './ActiveGameParticipant'

type PoroActiveGameParticipant = {
  premadeId: Maybe<number>
  riotId: RiotId
  summonerLevel: number
  champion: Maybe<PoroActiveGameParticipantChampion>
  leagues: PoroLeagues
  role: Maybe<ChampionPosition>
  mainRoles: List<ChampionPosition>
  tags: List<PoroTag>
}

export type PoroActiveGameParticipantChampion = {
  percents: number
  played: number
  kills: number
  deaths: number
  assists: number
}

function toView(
  poroParticipant: PoroActiveGameParticipant,
  participant: ActiveGameParticipant,
  masteries: Maybe<ActiveGameMasteriesView>,
  shardsCount: Maybe<number>,
): ActiveGameParticipantView {
  return {
    riotId: Maybe.some(poroParticipant.riotId),
    profileIconId: participant.profileIconId,
    leagues: Maybe.some(PoroLeagues.toView(poroParticipant.leagues)),
    championId: participant.championId,
    masteries,
    shardsCount,
    spell1Id: participant.spell1Id,
    spell2Id: participant.spell2Id,
    perks: participant.perks,

    premadeId: poroParticipant.premadeId,
    summonerLevel: Maybe.some(poroParticipant.summonerLevel),
    championRankedStats: pipe(
      poroParticipant.champion,
      Maybe.map(({ kills, deaths, assists, ...winRate }) => {
        const { wins, losses } = WinRate.toWinsLosses(winRate)
        return { wins, losses, kills, deaths, assists }
      }),
    ),
    role: poroParticipant.role,
    mainRoles: poroParticipant.mainRoles,
    tags: poroParticipant.tags,
  }
}

const PoroActiveGameParticipant = { toView }

export { PoroActiveGameParticipant }
