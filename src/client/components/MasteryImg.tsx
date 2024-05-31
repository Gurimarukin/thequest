import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'

import { useTranslation } from '../contexts/TranslationContext'
import { Assets } from '../imgs/Assets'
import { cx } from '../utils/cx'

type Props = {
  level: ChampionLevel
  className?: string
}

export const MasteryImg: React.FC<Props> = ({ level, className }) => {
  const { t } = useTranslation('common')

  return (
    <img
      src={Assets.masteries[level]}
      alt={t.masteryIconAlt(level)}
      className={cx(['grayscale', level === 0], className)}
    />
  )
}
