import * as C from 'io-ts/Codec'

import type { List } from '../../../utils/fp'
import { Maybe } from '../../../utils/fp'
import { LeagueEntryView } from '../league/LeagueEntryView'

type SummonerLeaguesView = C.TypeOf<typeof codec>

const properties = {
  soloDuo: Maybe.codec(LeagueEntryView.codec),
  flex: Maybe.codec(LeagueEntryView.codec),
}

const codec = C.struct(properties)

const keys = Object.keys(properties) as List<keyof SummonerLeaguesView>

const SummonerLeaguesView = { codec, keys }

export { SummonerLeaguesView }
