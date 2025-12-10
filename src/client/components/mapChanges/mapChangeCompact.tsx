import { identity, pipe } from 'fp-ts/function'

import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import type { MapChangesDataSkill } from '../../../shared/models/api/MapChangesData'
import type { Skill } from '../../../shared/models/api/Skill'
import { type Dict, List } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { cx } from '../../utils/cx'
import type { MapChange } from './helpers'
import { StatChangeIcon, StatChangeValue } from './statChange'

export const compactChangeSizes: Dict<MapChange['type'], number> = {
  stat: 3,
  skill: 5,
}

type StatChangeCompactProps = {
  name: WikiStatsBalanceKey
  value: number
  /** @default false */
  reverse?: boolean
}

export const StatChangeCompact: React.FC<StatChangeCompactProps> = ({
  name,
  value,
  reverse = false,
}) => {
  const elems = pipe(
    [
      <StatChangeIcon key="icon" name={name} className="size-2.5" />,
      <StatChangeValue key="value" name={name} value={value} />,
    ],
    reverse ? List.reverse : identity,
  )

  return <li className={gridClassName(reverse)}>{elems}</li>
}

type SkillChangeCompactProps = {
  skill: Skill
  changes: MapChangesDataSkill
  /** @default false */
  reverse?: boolean
}

export const SkillChangeCompact: React.FC<SkillChangeCompactProps> = ({
  skill,
  changes,
  reverse = false,
}) => {
  const { t } = useTranslation('common')

  const elems = pipe(
    [
      <span
        key="html"
        dangerouslySetInnerHTML={{ __html: changes.icon }}
        className="wiki compact"
      />,
      <span key="name">{t.labels.skill[skill]}</span>,
    ],
    reverse ? List.reverse : identity,
  )

  return <li className={gridClassName(reverse)}>{elems}</li>
}

function gridClassName(reverse: boolean): string | undefined {
  return cx(
    'grid items-center gap-1',
    reverse ? 'grid-cols-[1fr_max-content] justify-items-end' : 'grid-cols-[max-content_1fr]',
  )
}
