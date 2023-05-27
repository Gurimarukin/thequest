import * as C from 'io-ts/Codec'

import { DictUtils } from '../../../utils/DictUtils'
import { Maybe } from '../../../utils/fp'
import { LeagueEntryView } from '../league/LeagueEntryView'

type SummonerLeaguesView = C.TypeOf<typeof codec>

const properties = {
  soloDuo: Maybe.codec(LeagueEntryView.codec),
  flex: Maybe.codec(LeagueEntryView.codec),
}

const codec = C.struct(properties)

const keys = DictUtils.keys(properties)

const SummonerLeaguesView = { codec, keys }

export { SummonerLeaguesView }
