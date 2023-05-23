import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { LeagueEntryView } from '../league/LeagueEntryView'

type SummonerLeaguesView = C.TypeOf<typeof codec>

const codec = C.struct({
  soloDuo: Maybe.codec(LeagueEntryView.codec),
  flex: Maybe.codec(LeagueEntryView.codec),
})

const SummonerLeaguesView = { codec }

export { SummonerLeaguesView }
