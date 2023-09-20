import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { Maybe } from '../../../shared/utils/fp'

import type { PoroLeague } from './PoroLeague'

type PoroLeagues = {
  soloDuo: Maybe<PoroLeague>
  flex: Maybe<PoroLeague>
}

const toView = (leagues: PoroLeagues): SummonerLeaguesView => ({
  soloDuo: Maybe.none,
  flex: Maybe.none,
})

const PoroLeagues = { toView }

export { PoroLeagues }
