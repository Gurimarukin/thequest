import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import type { List } from '../../../shared/utils/fp'

import type { MapChangesStatsProps } from './stats/mapChangesStats'
import { getMapChangesStats, renderStatIcon, renderStatValue } from './stats/mapChangesStats'

type Props = {
  data: MapChangesData
}

export const MapChangesTooltip: React.FC<Props> = ({ data }) => (
  <MapChangesStatsFull data={data}>{renderMapChangesChildren}</MapChangesStatsFull>
)

const MapChangesStatsFull: React.FC<MapChangesStatsProps> = getMapChangesStats(
  (t, name, draggable) => {
    const icon = renderStatIcon(t.mapChanges, name, draggable, 'h-4, w-4')
    const renderStatValue_ = renderStatValue(name, 'gap-[3px]')

    return value => (
      <li key={name} className="contents">
        <div className="flex items-center gap-2 pr-2">
          <span>{icon}</span>
          <span className="grow">{t.common.labels.wikiStatsBalance[name]}</span>
        </div>
        {renderStatValue_(value)}
        <span />
      </li>
    )
  },
  (t, spell) => html => (
    <li key={spell} className="col-span-3 flex flex-col gap-1 last:mb-1">
      <div className="flex items-center gap-1">
        <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wiki" />
        <span>{t.mapChanges.spell(spell)}</span>
      </div>
      <span dangerouslySetInnerHTML={{ __html: html.description }} className="wiki" />
    </li>
  ),
  Infinity,
)

const renderMapChangesChildren = (children: List<React.ReactElement>): React.ReactElement => (
  <ul className="grid max-w-sm grid-cols-[auto_auto_1fr] items-center gap-y-2 py-1">{children}</ul>
)
