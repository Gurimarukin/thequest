import { createEnum } from '../../utils/createEnum'

type Spell = typeof Spell.T

const Spell = createEnum('I', 'Q', 'W', 'E', 'R')

export { Spell }
