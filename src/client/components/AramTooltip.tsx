import type { AramData } from '../../shared/models/api/AramData'
import { SpellName } from '../../shared/models/api/SpellName'
import { WikiaStatsBalance } from '../../shared/models/wikia/WikiaStatsBalance'
import type { List } from '../../shared/utils/fp'

import type { AramStatsProps } from './aramStats/aramStats'
import { getAramStats, renderStatIcon, renderStatValue } from './aramStats/aramStats'

type Props = {
  aram: AramData
}

export const AramTooltip: React.FC<Props> = ({ aram }) => (
  <AramStatsFull aram={aram}>{renderAramChildren}</AramStatsFull>
)

const AramStatsFull: React.FC<AramStatsProps> = getAramStats(
  name => {
    const icon = renderStatIcon(name, 'h-4, w-4')
    const label = WikiaStatsBalance.label[name]
    const renderStatValue_ = renderStatValue(name)
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
      <li key={spell} className="col-span-3 flex flex-col gap-1 last:mb-1">
        <div className="flex items-center gap-1">
          <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wikia" />
          <span>({SpellName.label[spell]}) :</span>
        </div>
        <span dangerouslySetInnerHTML={{ __html: html.description }} className="wikia" />
      </li>
    ),
  Infinity,
)

const renderAramChildren = (children: List<React.JSX.Element>): React.JSX.Element => (
  <ul className="grid max-w-sm grid-cols-[auto_auto_1fr] items-center gap-y-2 py-1">{children}</ul>
)
