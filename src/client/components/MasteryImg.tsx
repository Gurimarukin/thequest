import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'

import { Assets } from '../imgs/Assets'
import { cx } from '../utils/cx'

type Props = {
  level: ChampionLevelOrZero
  className?: string
}

export const MasteryImg: React.FC<Props> = ({ level, className }) => (
  <img
    src={Assets.masteries[level]}
    alt={`Icône niveau ${level}`}
    className={cx(['grayscale', level === 0], className)}
  />
)
