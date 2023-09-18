import type { ActiveGameMasteriesView } from '../../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { BannedChampion } from '../../../shared/models/api/activeGame/BannedChampion'
import type { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { RuneId } from '../../../shared/models/api/perk/RuneId'
import type { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import type { List, Maybe } from '../../../shared/utils/fp'

import type { SummonerId } from '../summoner/SummonerId'

type ActiveGameParticipant = {
  summonerId: SummonerId
  summonerName: string
  profileIconId: number
  championId: ChampionKey
  bannedChampion: BannedChampion
  spell1Id: SummonerSpellKey
  spell2Id: SummonerSpellKey
  perks: {
    perkIds: List<RuneId>
    perkStyle: RuneStyleId
    perkSubStyle: RuneStyleId
  }
}

type ToView = {
  leagues: Maybe<SummonerLeaguesView>
  masteries: Maybe<ActiveGameMasteriesView>
  shardsCount: Maybe<number>
}

const toView =
  ({ leagues, masteries, shardsCount }: ToView) =>
  (participant: ActiveGameParticipant): ActiveGameParticipantView => ({
    ...participant,
    leagues,
    masteries,
    shardsCount,
  })

const ActiveGameParticipant = { toView }

export { ActiveGameParticipant }
