import { createEnum } from '../../../utils/createEnum'

type LeagueTier = typeof LeagueTier.T

const LeagueTier = createEnum(
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
)

export { LeagueTier }
