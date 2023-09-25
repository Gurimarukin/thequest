import type { LeagueView } from '../../../shared/models/api/league/LeagueView'
import type { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import { Dict, Maybe } from '../../../shared/utils/fp'

import type { LeagueEntryRanked } from './LeagueEntry'

type Leagues = {
  soloDuo: Maybe<LeagueEntryRanked>
  flex: Maybe<LeagueEntryRanked>
}

const toView: (leagues: Leagues) => SummonerLeaguesView = Dict.map(
  (currentSplit): LeagueView => ({
    currentSplit,
    previousSplit: Maybe.none,
  }),
)

const Leagues = { toView }

export { Leagues }
