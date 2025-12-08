import { identity, pipe } from 'fp-ts/function'

import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import type { SpellName } from '../../../shared/models/api/SpellName'
import { type Dict, List } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { cx } from '../../utils/cx'
import type { MapChange } from './helpers'
import { StatChangeIcon, StatChangeValue } from './statChange'

export const compactChangeSizes: Dict<MapChange['type'], number> = {
  stat: 3,
  spell: 5,
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

type SpellChangeCompactProps = {
  name: SpellName
  spellImage: string
  /** @default false */
  reverse?: boolean
}

export const SpellChangeCompact: React.FC<SpellChangeCompactProps> = ({
  name,
  spellImage,
  reverse = false,
}) => {
  const { t } = useTranslation('common')

  const elems = pipe(
    [
      <span key="html" dangerouslySetInnerHTML={{ __html: spellImage }} className="wiki compact" />,
      <span key="name">{t.labels.spell[name]}</span>,
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
