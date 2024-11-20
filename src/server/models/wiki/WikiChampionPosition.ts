import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { createEnum } from '../../../shared/utils/createEnum'
import type { Dict } from '../../../shared/utils/fp'

type WikiChampionPosition = typeof e.T

const e = createEnum('Top', 'Jungle', 'Middle', 'Bottom', 'Support')

const position: Dict<WikiChampionPosition, ChampionPosition> = {
  Top: 'top',
  Jungle: 'jun',
  Middle: 'mid',
  Bottom: 'bot',
  Support: 'sup',
}

const WikiChampionPosition = { ...e, position }

export { WikiChampionPosition }
