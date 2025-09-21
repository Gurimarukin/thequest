import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import type { SpellName } from '../../../shared/models/api/SpellName'
import type { Dict } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import type { MapChange } from './helpers'
import { StatChangeIcon, StatChangeValue } from './statChange'

export const compactChangeSizes: Dict<MapChange['type'], number> = {
  stat: 3,
  spell: 5,
}

type StatChangeCompactProps = {
  name: WikiStatsBalanceKey
  value: number
}

export const StatChangeCompact: React.FC<StatChangeCompactProps> = ({ name, value }) => (
  <li className="flex items-center gap-1">
    <StatChangeIcon name={name} className="size-2.5" />

    <StatChangeValue name={name} value={value} />
  </li>
)

type SpellChangeCompactProps = {
  name: SpellName
  spellHtml: string
}

export const SpellChangeCompact: React.FC<SpellChangeCompactProps> = ({ name, spellHtml }) => {
  const { t } = useTranslation('common')

  return (
    <li className="flex items-center gap-1">
      <span dangerouslySetInnerHTML={{ __html: spellHtml }} className="wiki compact shrink-0" />

      <span>{t.labels.spell[name]}</span>
    </li>
  )
}
