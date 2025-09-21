import { pipe } from 'fp-ts/function'

import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import { WikiStatsBalance } from '../../../shared/models/WikiStatsBalance'
import { Maybe } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { Assets } from '../../imgs/Assets'
import { cx } from '../../utils/cx'

type StatChangeIconProps = {
  name: WikiStatsBalanceKey
  className?: string
}

export const StatChangeIcon: React.FC<StatChangeIconProps> = ({ name, className }) => {
  const { t } = useTranslation('mapChanges')

  return (
    <img
      src={Assets.stats[name]}
      alt={t.statIconAlt(name)}
      className={cx('shrink-0 bg-contain brightness-75 sepia', className)}
    />
  )
}

type StatChangeValueProps = {
  name: WikiStatsBalanceKey
  value: number
}

export const StatChangeValue: React.FC<StatChangeValueProps> = ({ name, value }) => {
  const isMalusStat = WikiStatsBalance.isMalusStat(name)
  const maybeUnit = WikiStatsBalance.isPercentsStat(name) ? Maybe.some('%') : Maybe.none

  const n = WikiStatsBalance.isModifierStat(name) ? (value * 1000 - 1000) / 10 : value

  return (
    <span
      className={cx(
        'flex shrink-0 font-lib-mono',
        (isMalusStat ? 0 < n : n < 0) ? 'text-red' : 'text-green',
      )}
    >
      <span>
        {n < 0 ? null : '+'}
        {n}
      </span>

      {pipe(
        maybeUnit,
        Maybe.fold(
          () => null,
          u => <span>{u}</span>,
        ),
      )}
    </span>
  )
}
