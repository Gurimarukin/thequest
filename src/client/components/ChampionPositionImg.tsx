import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'

import { positionsIcons } from '../imgs/svgs/positionsIcons'

type Props = {
  position: ChampionPosition
  /**
   * Should define a fixed width and height
   */
  className?: string
}

export const ChampionPositionImg: React.FC<Props> = ({ position, className }) => {
  const Position = positionsIcons[position]
  return <Position className={className} />
}
