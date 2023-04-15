import { createEnum } from '../../../utils/createEnum'

type ChampionType = typeof ChampionType.T

const ChampionType = createEnum('Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank')

export { ChampionType }
