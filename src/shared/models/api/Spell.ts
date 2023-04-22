import { createEnum } from '../../utils/createEnum'
import type { Dict } from '../../utils/fp'

type Spell = typeof e.T

const e = createEnum('I', 'Q', 'W', 'E', 'R')

const label: Dict<Spell, string> = {
  I: 'P',
  Q: 'Q',
  W: 'W',
  E: 'E',
  R: 'R',
}

const Spell = { ...e, label }

export { Spell }
