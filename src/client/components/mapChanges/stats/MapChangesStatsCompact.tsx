import type { MapChangesStatsProps } from './mapChangesStats'
import { getMapChangesStats, renderStatIcon, renderStatValue } from './mapChangesStats'

export const MapChangesStatsCompact: React.FC<MapChangesStatsProps> = getMapChangesStats(
  (t, name) => {
    const icon = renderStatIcon(t.mapChanges, name, 'h-2.5 w-2.5')
    const renderStatValue_ = renderStatValue(name, 'gap-px')

    return value => (
      <li key={name} className="flex items-center gap-1">
        <span className="shrink-0">{icon}</span>
        {renderStatValue_(value)}
      </li>
    )
  },
  (t, spell) => html => (
    <li key={spell} className="flex items-center gap-1">
      <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wiki compact" />
      <span>{t.common.labels.spell[spell]}</span>
    </li>
  ),
  4,
)
