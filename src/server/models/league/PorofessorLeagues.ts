import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { Maybe } from '../../../shared/utils/fp'

type PorofessorLeagues = {}

const toView = (leagues: PorofessorLeagues): SummonerLeaguesView => ({
  soloDuo: Maybe.none,
  flex: Maybe.none,
})

const PorofessorLeagues = { toView }

export { PorofessorLeagues }
