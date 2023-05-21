import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { ChampionKey } from '../champion/ChampionKey'
import { TeamId } from './TeamId'

type ActiveGameParticipantView = C.TypeOf<typeof codec>

const codec = C.struct({
  teamId: TeamId.codec,
  summonerName: C.string,
  profileIconId: C.number,
  championId: ChampionKey.codec,
  shardsCount: C.number,
  spell1Id: C.number,
  spell2Id: C.number,
  perks: C.struct({
    perkIds: List.codec(C.number),
    perkStyle: C.number,
    perkSubStyle: C.number,
  }),
})

const ActiveGameParticipantView = { codec }

export { ActiveGameParticipantView }
