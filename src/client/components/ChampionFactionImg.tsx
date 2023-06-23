import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'

import { Assets } from '../imgs/Assets'
import { cx } from '../utils/cx'

type Props = {
  faction: ChampionFaction
  /**
   * Should define a fixed width and height
   */
  className?: string
}

export const ChampionFactionImg: React.FC<Props> = ({ faction, className }) => (
  <div
    className={cx('flex items-center justify-center bg-current', className)}
    style={{
      maskImage: `url(${Assets.factions[faction]})`,
      maskSize: '100% 100%, contain',
    }}
  />
)
