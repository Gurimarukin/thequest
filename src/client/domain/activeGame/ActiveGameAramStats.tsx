import { useMemo } from 'react'

import { List } from '../../../shared/utils/fp'

import type { AramStatsProps } from '../../components/aramStats/aramStats'
import { getAramStats, renderStatIcon, renderStatValue } from '../../components/aramStats/aramStats'
import { cx } from '../../utils/cx'

type Props = Pick<AramStatsProps, 'aram' | 'draggable'> & {
  reverse: boolean
}

export const ActiveGameAramStats: React.FC<Props> = ({ reverse, ...props }) => {
  const AramStats = useMemo(
    () =>
      getAramStats(
        (t, name) => {
          const icon = renderStatIcon(t.aram, name, props.draggable, 'h-full w-full')
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
              className="wikia compact size-5"
            />
            <span>{t.common.labels.spell[spell]}</span>
          </li>
        ),
        5,
      ),
    [props.draggable, reverse],
  )

  return <AramStats {...props}>{renderAramStats}</AramStats>
}

const renderAramStats = (
  children1: List<React.ReactElement>,
  children2: List<React.ReactElement>,
): React.ReactElement => (
  <>
    <ul className="flex flex-col gap-0.5">{children1}</ul>
    {List.isNonEmpty(children2) ? <ul className="flex flex-col gap-0.5">{children2}</ul> : null}
  </>
)
