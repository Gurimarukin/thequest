import { createEnum } from '../../../utils/createEnum'

type ChampionRole = typeof ChampionRole.T

const ChampionRole = createEnum('Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank')

export { ChampionRole }
