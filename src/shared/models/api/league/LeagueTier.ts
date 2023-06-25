import { createEnum } from '../../../utils/createEnum'
import type { Dict } from '../../../utils/fp'
import { List } from '../../../utils/fp'

type FourRanksTier = typeof FourRanksTier.T

const FourRanksTier = createEnum('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND')

type OneRankTier = typeof OneRankTier.T

const OneRankTier = createEnum('MASTER', 'GRANDMASTER', 'CHALLENGER')

type LeagueTier = typeof e.T

const e = createEnum(...FourRanksTier.values, ...OneRankTier.values)

const isFourRanks = (tier: LeagueTier): tier is FourRanksTier =>
  List.elem(e.Eq)(tier, FourRanksTier.values)

const label: Dict<LeagueTier, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  DIAMOND: 'Diamant',
  MASTER: 'Maître',
  GRANDMASTER: 'Grand Maître',
  CHALLENGER: 'Challenger',
}

const LeagueTier = { ...e, isFourRanks, label }

export { FourRanksTier, LeagueTier, OneRankTier }
