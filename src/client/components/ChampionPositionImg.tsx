import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'

import { useTranslation } from '../contexts/TranslationContext'
import { Assets } from '../imgs/Assets'
import { cx } from '../utils/cx'

type Props = {
  position: ChampionPosition
  /**
   * Should define a fixed width and height
   */
  className?: string
}

export const ChampionPositionImg: React.FC<Props> = ({ position, className }) => {
  const { t } = useTranslation('common')
  return (
    <div className={cx('flex items-center justify-center', className)}>
      <img
        src={Assets.positions[position]}
        alt={t.positionIconAlt(position)}
        className={cx(['mx-[8.33%] h-5/6 w-5/6', position === 'jun' || position === 'sup'])}
      />
    </div>
  )
}
