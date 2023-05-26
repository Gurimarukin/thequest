import * as C from 'io-ts/Codec'

import { List, Maybe } from '../../../utils/fp'
import { ChampionKey } from '../champion/ChampionKey'
import { SummonerLeaguesView } from '../summoner/SummonerLeaguesView'
import { SummonerSpellKey } from '../summonerSpell/SummonerSpellKey'
import { ActiveGameMasteryView } from './ActiveGameMasteryView'
import { TeamId } from './TeamId'

type ActiveGameParticipantView = C.TypeOf<typeof codec>

const codec = C.struct({
  teamId: TeamId.codec,
  summonerName: C.string,
  profileIconId: C.number,
  leagues: Maybe.codec(SummonerLeaguesView.codec),
  totalMasteryScore: C.number,
  championId: ChampionKey.codec,
  shardsCount: C.number,
  mastery: Maybe.codec(ActiveGameMasteryView.codec),
  spell1Id: SummonerSpellKey.codec,
  spell2Id: SummonerSpellKey.codec,
  perks: C.struct({
    perkIds: List.codec(C.number),
    perkStyle: C.number,
    perkSubStyle: C.number,
  }),
})

const ActiveGameParticipantView = { codec }

export { ActiveGameParticipantView }
