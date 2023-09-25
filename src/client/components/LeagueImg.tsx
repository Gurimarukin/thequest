import { forwardRef } from 'react'

import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { Dict } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { cx } from '../utils/cx'

export const miniCrestIcon = (tier: 'unranked' | LeagueTier): string =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.svg`

export type LeagueImgProps = {
  tier: 'unranked' | LeagueTier
  rank: LeagueRank
  /**
   * Should define a fixed width and height
   */
  className?: string
  style?: React.CSSProperties
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'className' | 'style'>

export const LeagueImg = forwardRef<HTMLSpanElement, LeagueImgProps>(
  ({ tier, rank, className, style, ...props }, ref) => {
    const { t } = useTranslation('common')
    return (
      <span ref={ref} className={cx('flex items-center overflow-hidden', className)} style={style}>
        <img
          src={miniCrestIcon(tier)}
          alt={
            tier === 'unranked'
              ? t.league.unrankedIconAlt
              : t.league.tierRankAlt(tier, LeagueTier.isRegularTier(tier) ? rank : undefined)
          }
          className={cx('mr-[-100%] max-w-none', imgClassName[tier])}
          {...props}
        />
      </span>
    )
  },
)

const imgClassName: Dict<LeagueImgProps['tier'], string> = {
  unranked: 'w-[37%] ml-[31.5%]', // mt-[22%]
  IRON: 'w-[86%] mt-[9%] ml-[4.5%]',
  BRONZE: 'w-[90%] mt-[9%] ml-[5%]',
  SILVER: 'w-[90%] mt-[9%] ml-[5%]',
  GOLD: 'w-[92%] mt-[14.5%] ml-[6.5%]',
  PLATINUM: 'w-[106%] mt-[19%] ml-[-3%]',
  EMERALD: 'w-[106%] mt-[19%] ml-[-3%]',
  DIAMOND: 'w-[106%] mt-[19%] ml-[-3%]',
  MASTER: 'w-[106%] ml-[-6%]',
  GRANDMASTER: 'w-[106%] ml-[-6%]',
  CHALLENGER: 'w-[106%] ml-[-6%]',
}
