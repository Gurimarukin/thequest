import { createEnum } from '../../../utils/createEnum'
import { List } from '../../../utils/fp'

type RegularTier = typeof RegularTier.T

const RegularTier = createEnum('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND')

type ApexTier = typeof ApexTier.T

const ApexTier = createEnum('MASTER', 'GRANDMASTER', 'CHALLENGER')

type LeagueTier = typeof e.T

const e = createEnum(...RegularTier.values, ...ApexTier.values)

const isApexTier = (tier: LeagueTier): tier is ApexTier => List.elem(e.Eq)(tier, ApexTier.values)

const isRegularTier = (tier: LeagueTier): tier is RegularTier =>
  List.elem(e.Eq)(tier, RegularTier.values)

const LeagueTier = { ...e, isApexTier, isRegularTier }

export { ApexTier, LeagueTier, RegularTier }
