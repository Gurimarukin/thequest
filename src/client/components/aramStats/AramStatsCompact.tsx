import type { AramStatsProps } from './aramStats'
import { getAramStats, renderStatIcon, renderStatValue } from './aramStats'

export const AramStatsCompact: React.FC<AramStatsProps> = getAramStats(
  (t, name, draggable) => {
    const icon = renderStatIcon(t.aram, name, draggable, 'h-2.5 w-2.5')
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
      <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wikia compact" />
      <span>{t.common.labels.spell[spell]}</span>
    </li>
  ),
  4,
)
