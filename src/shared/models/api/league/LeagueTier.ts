import { createEnum } from '../../../utils/createEnum'
import { List } from '../../../utils/fp'

type FourRanksTier = typeof FourRanksTier.T

const FourRanksTier = createEnum('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND')

type OneRankTier = typeof OneRankTier.T

const OneRankTier = createEnum('MASTER', 'GRANDMASTER', 'CHALLENGER')

type LeagueTier = typeof e.T

const e = createEnum(...FourRanksTier.values, ...OneRankTier.values)

const isFourRanks = (tier: LeagueTier): tier is FourRanksTier =>
  List.elem(e.Eq)(tier, FourRanksTier.values)

const LeagueTier = { ...e, isFourRanks }

export { FourRanksTier, LeagueTier, OneRankTier }
