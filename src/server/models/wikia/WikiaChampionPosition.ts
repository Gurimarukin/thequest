import type { Lane } from '../../../shared/models/api/Lane'
import { createEnum } from '../../../shared/utils/createEnum'
import type { Dict } from '../../../shared/utils/fp'

type WikiaChampionPosition = typeof e.T

const e = createEnum('Top', 'Jungle', 'Middle', 'Bottom', 'Support')

const lane: Dict<WikiaChampionPosition, Lane> = {
  Top: 'top',
  Jungle: 'jun',
  Middle: 'mid',
  Bottom: 'bot',
  Support: 'sup',
}

const WikiaChampionPosition = { ...e, lane }

export { WikiaChampionPosition }
