import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { Dict, Maybe } from '../../../shared/utils/fp'

import { PoroLeague } from './PoroLeague'

type PoroLeagues = {
  soloDuo: Maybe<PoroLeague>
  flex: Maybe<PoroLeague>
}

const toView: (leagues: PoroLeagues) => SummonerLeaguesView = Dict.map(Maybe.map(PoroLeague.toView))

const PoroLeagues = { toView }

export { PoroLeagues }
