import { useMemo } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'

import { useTranslation } from '../../contexts/TranslationContext'
import { mapChangesFromData } from './helpers'
import { StatChangeIcon, StatChangeValue } from './statChange'

type Props = {
  data: MapChangesData
}

export const MapChangesTooltip: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation()

  const changes = useMemo(() => mapChangesFromData(data), [data])

  return (
    <ul className="grid max-w-sm grid-cols-[auto_auto_1fr] items-center gap-y-2 py-1">
      {changes.map(c => {
        switch (c.type) {
          case 'stat':
            return (
              <li key={c.name} className="contents">
                <div className="flex items-center gap-2 pr-2">
                  <StatChangeIcon name={c.name} className="size-4" />

                  <span className="grow">{t.common.labels.wikiStatsBalance[c.name]}</span>
                </div>

                <StatChangeValue name={c.name} value={c.value} />

                <span />
              </li>
            )

          case 'spell':
            return (
              <li key={c.name} className="col-span-3 flex flex-col gap-1 last:mb-1">
                <div className="flex items-center gap-1">
                  <span dangerouslySetInnerHTML={{ __html: c.html.image }} className="wiki" />

                  <span>{t.mapChanges.spell(c.name)}</span>
                </div>

                <span dangerouslySetInnerHTML={{ __html: c.html.description }} className="wiki" />
              </li>
            )
        }
      })}
    </ul>
  )
}
