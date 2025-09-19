import { forwardRef, useMemo } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import { List } from '../../../shared/utils/fp'

import { partitionStats2Cols } from '../../components/mapChanges/partitionStats'
import { cx } from '../../utils/cx'

type Props = {
  data: MapChangesData
  reverse: boolean
}

export const ActiveGameMapChangesStats = forwardRef<HTMLDivElement, Props>(
  ({ data, reverse }, ref) => {
    const { initial, more } = useMemo(
      () => partitionStats2Cols(24.5 /* 98px */ - 2 /* (padding) */, data),
      [data],
    )

    return (
      <div
        ref={ref}
        className={cx('flex items-center gap-1 overflow-hidden py-1 text-2xs', {
          'justify-end': reverse,
        })}
      >
        {List.isNonEmpty(initial) && <ul>{initial}</ul>}
        {List.isNonEmpty(more) && <ul>{more}</ul>}
      </div>
    )
  },
)
