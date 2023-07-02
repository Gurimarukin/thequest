import { createEnum } from '../../utils/createEnum'

type SpellName = typeof e.T

const e = createEnum('I', 'Q', 'W', 'E', 'R')

const SpellName = e

export { SpellName }
