import { monoid, number, separated } from 'fp-ts'
import { identity, pipe } from 'fp-ts/function'
import { forwardRef, useMemo } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import { List, Maybe } from '../../../shared/utils/fp'

import type { MapChange } from '../../components/mapChanges/helpers'
import {
  type InitialMore,
  mapChangesFromData,
  splitWhileSmallerThan,
} from '../../components/mapChanges/helpers'
import {
  SkillChangeCompact,
  StatChangeCompact,
  compactChangeSizes,
} from '../../components/mapChanges/mapChangeCompact'
import { cx } from '../../utils/cx'

type Props = {
  data: MapChangesData
  reverse: boolean
}

export const ActiveGameMapChangesStats = forwardRef<HTMLDivElement, Props>(
  ({ data, reverse }, ref) => {
    const { initial, more } = useMemo(() => partitionStats2Cols(data, reverse), [data, reverse])

    const uls = pipe(
      [initial, more],
      List.filterMapWithIndex((i, lis) =>
        List.isNonEmpty(lis) ? Maybe.some(<ul key={i}>{lis}</ul>) : Maybe.none,
      ),
      reverse ? List.reverse : identity,
    )

    if (List.isEmpty(uls)) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cx('grid items-center py-1 text-2xs', ['gap-1', uls.length > 1])}
        style={{ gridTemplateColumns: `repeat(${uls.length}, auto)` }}
      >
        {uls}
      </div>
    )
  },
)

const limitSize = 24.5 /* 98px */ - 2 /* (padding) */

function partitionStats2Cols(
  data: MapChangesData,
  reverse: boolean,
): InitialMore<React.ReactElement> {
  const changes = mapChangesFromData(data)

  const sizes_ = changes.map(change => compactChangeSizes[change.type])

  const totalSize = pipe(sizes_, monoid.concatAll(number.MonoidSum))

  if (totalSize <= limitSize) {
    return { initial: toElements(reverse)(changes), more: [] }
  }

  const { left: initial, right: more } = pipe(
    splitWhileSmallerThan({ ...compactChangeSizes, limit: totalSize / 2 })(changes),
    separated.bimap(toElements(reverse), toElements(reverse)),
  )

  return { initial, more }
}

const toElements = (reverse: boolean): ((changes: List<MapChange>) => List<React.ReactElement>) =>
  List.map(change => {
    switch (change.type) {
      case 'stat':
        return (
          <StatChangeCompact
            key={change.name}
            name={change.name}
            value={change.value}
            reverse={reverse}
          />
        )

      case 'skill':
        return (
          <SkillChangeCompact
            key={change.skill}
            skill={change.skill}
            changes={change.changes}
            reverse={reverse}
          />
        )
    }
  })
