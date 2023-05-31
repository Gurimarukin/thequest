import { createEnum } from '../../utils/createEnum'
import type { Dict } from '../../utils/fp'

type SpellName = typeof e.T

const e = createEnum('I', 'Q', 'W', 'E', 'R')

const label: Dict<SpellName, string> = {
  I: 'P',
  Q: 'Q',
  W: 'W',
  E: 'E',
  R: 'R',
}

const SpellName = { ...e, label }

export { SpellName }
