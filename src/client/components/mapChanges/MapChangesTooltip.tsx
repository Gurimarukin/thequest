import { useMemo } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import { Either } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { StatIcon, StatValue, dataToStatsAndSpells } from './partitionStats'

type Props = {
  data: MapChangesData
}

export const MapChangesTooltip: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation()

  const eithers = useMemo(() => dataToStatsAndSpells(data), [data])

  return (
    <ul className="grid max-w-sm grid-cols-[auto_auto_1fr] items-center gap-y-2 py-1">
      {eithers.map(
        Either.fold(
          ({ stat, value }) => (
            <li key={stat} className="contents">
              <div className="flex items-center gap-2 pr-2">
                <StatIcon stat={stat} className="size-4" />
                <span className="grow">{t.common.labels.wikiStatsBalance[stat]}</span>
              </div>

              <StatValue stat={stat} value={value} />

              <span />
            </li>
          ),
          ({ spell, html }) => (
            <li key={spell} className="col-span-3 flex flex-col gap-1 last:mb-1">
              <div className="flex items-center gap-1">
                <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wiki" />
                <span>{t.mapChanges.spell(spell)}</span>
              </div>
              <span dangerouslySetInnerHTML={{ __html: html.description }} className="wiki" />
            </li>
          ),
        ),
      )}
    </ul>
  )
}
