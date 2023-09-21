import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { Dict } from '../../../shared/utils/fp'

import { PoroLeague } from './PoroLeague'

type PoroLeagues = {
  soloDuo: PoroLeague
  flex: PoroLeague
}

const toView: (leagues: PoroLeagues) => SummonerLeaguesView = Dict.map(PoroLeague.toView)

const PoroLeagues = { toView }

export { PoroLeagues }
