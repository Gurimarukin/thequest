import type { eq } from 'fp-ts'
import { string } from 'fp-ts'

import { createEnum } from '../../utils/createEnum'
import type { Dict } from '../../utils/fp'

type Lane = typeof e.T

const e = createEnum('top', 'jun', 'mid', 'bot', 'sup')

const label: Dict<Lane, string> = {
  top: 'Haut',
  jun: 'Jungle',
  mid: 'Milieu',
  bot: 'Bas',
  sup: 'Support',
}

const Eq: eq.Eq<Lane> = string.Eq

const Lane = { ...e, label, Eq }

export { Lane }
