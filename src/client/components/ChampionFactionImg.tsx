import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'

import { Assets } from '../imgs/Assets'
import { MaskedImage } from './MaskedImage'

type Props = {
  faction: ChampionFaction | 'runeterra'
  /**
   * Should define a fixed width and height
   */
  className?: string
}

export const ChampionFactionImg: React.FC<Props> = ({ faction, className }) => (
  <MaskedImage
    src={faction === 'runeterra' ? Assets.runeterra : Assets.factions[faction]}
    className={className}
  />
)
