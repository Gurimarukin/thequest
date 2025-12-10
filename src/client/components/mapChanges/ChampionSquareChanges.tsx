import { separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { pipe } from 'fp-ts/function'
import { useMemo, useRef } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import type { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { List } from '../../../shared/utils/fp'

import type { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import { Tooltip } from '../tooltip/Tooltip'
import { MapChangesTooltip } from './MapChangesTooltip'
import type { InitialMore, MapChange } from './helpers'
import { mapChangesFromData, splitWhileSmallerThan } from './helpers'
import { SkillChangeCompact, StatChangeCompact, compactChangeSizes } from './mapChangeCompact'

type Props = {
  tooltiPlacementRef: React.RefObject<Element>
  /**
   * @param wrapAfterSize should be `imageSize - 2 x paddingYSize`
   */
  wrapAfterSize: number
  data: MapChangesData
}

export type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  category: MapChangesChampionCategory
}

export const championSquareChangesClassName =
  'grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] rounded-lg bg-aram-stats text-2xs'

export const ChampionSquareChanges: React.FC<Props> = ({
  tooltiPlacementRef,
  wrapAfterSize,
  data,
}) => {
  const initialRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  const { initial, more } = useMemo(
    () => partitionStatsWrap(wrapAfterSize, data),
    [data, wrapAfterSize],
  )

  return (
    <>
      <div ref={initialRef} className="row-span-2 grid place-items-center">
        {List.isNonEmpty(initial) && <ul className="p-0.5">{initial}</ul>}
      </div>

      <div ref={moreRef} className="grid items-end justify-items-center">
        {List.isNonEmpty(more) && <ul className="p-0.5">{more}</ul>}
      </div>

      <Tooltip hoverRef={[initialRef, moreRef]} placementRef={tooltiPlacementRef}>
        <MapChangesTooltip data={data} />
      </Tooltip>
    </>
  )
}

/**
 * Puts elements in `initial` until `wrapAfterSize` is reached.
 * Then puts remaining even elements in `more`, and appends odd elements to `initial`.
 *
 * @param wrapAfterSize should be `imageSize - 2 x paddingYSize`
 */
function partitionStatsWrap(
  wrapAfterSize: number,
  data: MapChangesData,
): InitialMore<React.ReactElement> {
  const { left: initial, right: more } = pipe(
    mapChangesFromData(data),
    splitWhileSmallerThan({
      ...compactChangeSizes,
      limit: wrapAfterSize,
    }),
    evenOddRights,
    separated.bimap(toElements, toElements),
  )

  return { initial, more }
}

const toElements = List.map((change: MapChange): React.ReactElement => {
  switch (change.type) {
    case 'stat':
      return <StatChangeCompact key={change.name} name={change.name} value={change.value} />

    case 'skill':
      return <SkillChangeCompact key={change.skill} skill={change.skill} changes={change.changes} />
  }
})

function evenOddRights<A>({
  left,
  right,
}: Separated<List<A>, List<A>>): Separated<List<A>, List<A>> {
  const { left: odds, right: evens } = pipe(
    right,
    List.partitionWithIndex(i => i % 2 === 0),
  )

  return {
    left: pipe(left, List.concat(odds)),
    right: evens,
  }
}
