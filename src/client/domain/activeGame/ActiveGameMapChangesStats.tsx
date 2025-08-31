import { useMemo } from 'react'

import { List } from '../../../shared/utils/fp'

import type { MapChangesStatsProps } from '../../components/mapChanges/stats/mapChangesStats'
import {
  getMapChangesStats,
  renderStatIcon,
  renderStatValue,
} from '../../components/mapChanges/stats/mapChangesStats'
import { cx } from '../../utils/cx'

type Props = Pick<MapChangesStatsProps, 'data'> & {
  reverse: boolean
}

export const ActiveGameMapChangesStats: React.FC<Props> = ({ reverse, ...props }) => {
  const MapChangesStats = useMemo(
    () =>
      getMapChangesStats(
        (t, name) => {
          const icon = renderStatIcon(t.mapChanges, name, 'size-full')
          const renderStatValue_ = renderStatValue(name, '')

          return value => (
            <li key={name} className={cx('flex items-center gap-1', ['flex-row-reverse', reverse])}>
              <span className="size-2.5">{icon}</span>
              {renderStatValue_(value)}
            </li>
          )
        },
        (t, spell) => html => (
          <li key={spell} className={cx('flex items-center gap-1', ['flex-row-reverse', reverse])}>
            <span
              dangerouslySetInnerHTML={{ __html: html.spell }}
              className="wiki compact size-5"
            />
            <span>{t.common.labels.spell[spell]}</span>
          </li>
        ),
        5,
      ),
    [reverse],
  )

  return <MapChangesStats {...props}>{renderMapChangesStats}</MapChangesStats>
}

const renderMapChangesStats = (
  children1: List<React.ReactElement>,
  children2: List<React.ReactElement>,
): React.ReactElement => (
  <>
    <ul className="flex flex-col gap-0.5">{children1}</ul>
    {List.isNonEmpty(children2) ? <ul className="flex flex-col gap-0.5">{children2}</ul> : null}
  </>
)
