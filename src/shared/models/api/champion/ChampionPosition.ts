import { createEnum } from '../../../utils/createEnum'

type ChampionPosition = typeof e.T

const e = createEnum('top', 'jun', 'mid', 'bot', 'sup')

const ChampionPosition = e

export { ChampionPosition }
