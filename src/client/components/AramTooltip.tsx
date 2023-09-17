import type { AramData } from '../../shared/models/api/AramData'
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
  (t, name, draggable) => {
    const icon = renderStatIcon(t.aram, name, draggable, 'h-4, w-4')
    const renderStatValue_ = renderStatValue(name)
    return value => (
      <li key={name} className="contents">
        <div className="flex items-center gap-2 pr-2">
          <span>{icon}</span>
          <span className="grow">{t.common.labels.wikiaStatsBalance[name]}</span>
        </div>
        {renderStatValue_(value)}
        <span />
      </li>
    )
  },
  (t, spell) => html =>
    (
      <li key={spell} className="col-span-3 flex flex-col gap-1 last:mb-1">
        <div className="flex items-center gap-1">
          <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wikia" />
          <span>{t.aram.spell(spell)}</span>
        </div>
        <span dangerouslySetInnerHTML={{ __html: html.description }} className="wikia" />
      </li>
    ),
  Infinity,
)

const renderAramChildren = (children: List<React.ReactElement>): React.ReactElement => (
  <ul className="grid max-w-sm grid-cols-[auto_auto_1fr] items-center gap-y-2 py-1">{children}</ul>
)
