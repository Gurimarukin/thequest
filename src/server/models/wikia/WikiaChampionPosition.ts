import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { createEnum } from '../../../shared/utils/createEnum'
import type { Dict } from '../../../shared/utils/fp'

type WikiaChampionPosition = typeof e.T

const e = createEnum('Top', 'Jungle', 'Middle', 'Bottom', 'Support')

const position: Dict<WikiaChampionPosition, ChampionPosition> = {
  Top: 'top',
  Jungle: 'jun',
  Middle: 'mid',
  Bottom: 'bot',
  Support: 'sup',
}

const WikiaChampionPosition = { ...e, position }

export { WikiaChampionPosition }
