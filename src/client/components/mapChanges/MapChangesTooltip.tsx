import { useMemo } from 'react'

import { Ability } from '../../../shared/models/api/Ability'
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
    <ul className="grid max-w-sm grid-cols-[auto_1fr] items-center gap-y-2 py-1">
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
              </li>
            )

          case 'skill':
            return (
              <li key={c.skill} className="col-span-2">
                <ul className="flex flex-col gap-1">
                  {Array.from(c.changes.abilities.entries()).map(
                    ([ability, { icon, description }]) => (
                      <li key={Ability.unwrap(ability)}>
                        <div className="flex items-center gap-1">
                          <span
                            dangerouslySetInnerHTML={{ __html: icon }}
                            className="wiki large mr-1"
                          />

                          <span>{Ability.unwrap(c.changes.name)}</span>

                          <span>{t.mapChanges.skill(c.skill)}</span>
                        </div>

                        <span dangerouslySetInnerHTML={{ __html: description }} className="wiki" />
                      </li>
                    ),
                  )}
                </ul>
              </li>
            )
        }
      })}
    </ul>
  )
}
