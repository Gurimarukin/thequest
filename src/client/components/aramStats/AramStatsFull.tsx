import { SpellName } from '../../../shared/models/api/SpellName'
import { WikiaStatsBalance } from '../../../shared/models/wikia/WikiaStatsBalance'

import type { AramStatsProps } from './AramStats'
import { getAramStats, renderStatIcon, renderStatValue } from './AramStats'

export const AramStatsFull: React.FC<AramStatsProps> = getAramStats(
  name => {
    const icon = renderStatIcon(name, 'h-4, w-4')
    const label = WikiaStatsBalance.label[name]
    const renderStatValue_ = renderStatValue(name, 'pt-1')
    return value => (
      <li key={name} className="contents">
        <div className="flex items-center gap-2 pr-2">
          <span>{icon}</span>
          <span className="grow">{label}</span>
        </div>
        {renderStatValue_(value)}
        <span />
      </li>
    )
  },
  spell => html =>
    (
      <li key={spell} className="col-span-3 mt-1 flex flex-col gap-1 last:mb-1">
        <div className="flex items-center gap-1">
          <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wikia" />
          <span>({SpellName.label[spell]}) :</span>
        </div>
        <span dangerouslySetInnerHTML={{ __html: html.description }} className="wikia" />
      </li>
    ),
  Infinity,
)
