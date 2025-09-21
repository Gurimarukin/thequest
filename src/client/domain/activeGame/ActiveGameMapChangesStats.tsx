import { monoid, number, separated } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { forwardRef, useMemo } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import { List } from '../../../shared/utils/fp'

import type { MapChange } from '../../components/mapChanges/helpers'
import {
  type InitialMore,
  mapChangesFromData,
  splitWhileSmallerThan,
} from '../../components/mapChanges/helpers'
import {
  SpellChangeCompact,
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

    return (
      <div
        ref={ref}
        className={cx('flex items-center gap-1 overflow-hidden py-1 text-2xs', {
          'flex-row-reverse': reverse,
        })}
      >
        {List.isNonEmpty(initial) && <ul>{initial}</ul>}

        {List.isNonEmpty(more) && <ul>{more}</ul>}
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
  // List.map((change: MapChange): React.ReactElement => {
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

      case 'spell':
        return (
          <SpellChangeCompact
            key={change.name}
            name={change.name}
            spellHtml={change.html.spell}
            reverse={reverse}
          />
        )
    }
  })
