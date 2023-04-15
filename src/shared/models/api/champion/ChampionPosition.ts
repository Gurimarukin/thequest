import type { eq } from 'fp-ts'
import { string } from 'fp-ts'

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

const Eq: eq.Eq<ChampionPosition> = string.Eq

const ChampionPosition = { ...e, label, Eq }

export { ChampionPosition }
