import { Spell } from '../../../shared/models/api/Spell'

import type { AramStatsProps } from './AramStats'
import { getAramStats, renderStatIcon, renderStatValue } from './AramStats'

export const AramStatsCompact: React.FC<AramStatsProps> = getAramStats(
  name => {
    const icon = renderStatIcon(name, 'h-2.5 w-2.5')
    const renderStatValue_ = renderStatValue(name)
    return value => (
      <li key={name} className="flex items-center gap-1">
        <span className="shrink-0">{icon}</span>
        {renderStatValue_(value)}
      </li>
    )
  },
  spell => html =>
    (
      <li key={spell} className="flex items-center gap-1">
        <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wikia compact" />
        <span>{Spell.label[spell]}</span>
      </li>
    ),
  4,
)
