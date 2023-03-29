import { createEnum } from '../../../shared/utils/createEnum'

type Game = typeof e.T

const e = createEnum('lor', 'val')

const Game = { ...e }

export { Game }
