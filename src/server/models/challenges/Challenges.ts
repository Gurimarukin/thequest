import type { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import type { Dict, Maybe } from '../../../shared/utils/fp'

import type { Challenge } from './Challenge'

type Challenges = Dict<ChampionFaction, Maybe<Challenge>>

export { Challenges }
