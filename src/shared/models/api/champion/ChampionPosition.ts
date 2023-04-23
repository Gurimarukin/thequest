import { createEnum } from '../../../utils/createEnum'
import type { Dict } from '../../../utils/fp'

type ChampionPosition = typeof e.T

const e = createEnum('top', 'jun', 'mid', 'bot', 'sup')

const label: Dict<ChampionPosition, string> = {
  top: 'Haut',
  jun: 'Jungle',
  mid: 'Milieu',
  bot: 'Bas',
  sup: 'Support',
}

const ChampionPosition = { ...e, label }

export { ChampionPosition }
