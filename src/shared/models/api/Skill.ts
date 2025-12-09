import { createEnum } from '../../utils/createEnum'

type Skill = typeof e.T

const e = createEnum('I', 'Q', 'W', 'E', 'R')

const Skill = e

export { Skill }
