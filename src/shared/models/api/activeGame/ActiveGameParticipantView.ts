import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { List, Maybe } from '../../../utils/fp'
import { RiotId } from '../../riot/RiotId'
import { ChampionKey } from '../champion/ChampionKey'
import { ChampionPosition } from '../champion/ChampionPosition'
import { PerksView } from '../perk/PerksView'
import { SummonerLeaguesView } from '../summoner/SummonerLeaguesView'
import { SummonerSpellKey } from '../summonerSpell/SummonerSpellKey'
import { ActiveGameMasteriesView } from './ActiveGameMasteriesView'
import { PoroTag } from './PoroTag'

type ActiveGameParticipantView = C.TypeOf<typeof codec>
type ActiveGameParticipantViewOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  riotId: RiotId.fromStringCodec,
  profileIconId: C.number,
  leagues: Maybe.codec(SummonerLeaguesView.codec),
  championId: ChampionKey.codec,
  masteries: Maybe.codec(ActiveGameMasteriesView.codec),
  shardsCount: Maybe.codec(C.number),
  spell1Id: SummonerSpellKey.codec,
  spell2Id: SummonerSpellKey.codec,
  perks: Maybe.codec(PerksView.codec),

  // poro
  premadeId: Maybe.codec(C.number),
  summonerLevel: Maybe.codec(C.number),
  championRankedStats: Maybe.codec(
    C.struct({
      wins: C.number,
      losses: C.number,
      kills: C.number,
      deaths: C.number,
      assists: C.number,
    }),
  ),
  role: Maybe.codec(ChampionPosition.codec),
  mainRoles: List.codec(ChampionPosition.codec),
  tags: List.codec(PoroTag.codec),
})

const Lens = {
  shardsCount: pipe(lens.id<ActiveGameParticipantView>(), lens.prop('shardsCount')),
}

const ActiveGameParticipantView = { codec, Lens }

export { ActiveGameParticipantView, ActiveGameParticipantViewOutput }
