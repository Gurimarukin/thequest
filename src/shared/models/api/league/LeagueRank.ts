import { createEnum } from '../../../utils/createEnum'

type LeagueRank = typeof LeagueRank.T

const LeagueRank = createEnum('I', 'II', 'III', 'IV')

export { LeagueRank }
