import * as C from 'io-ts/Codec'

import { DictUtils } from '../../../utils/DictUtils'
import { LeagueView } from '../league/LeagueView'

type SummonerLeaguesView = C.TypeOf<typeof codec>

const properties = {
  soloDuo: LeagueView.codec,
  flex: LeagueView.codec,
}

const codec = C.struct(properties)

const keys = DictUtils.keys(properties)

const SummonerLeaguesView = { codec, keys }

export { SummonerLeaguesView }
