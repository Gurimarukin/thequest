import { useMemo, useRef } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import type { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { List } from '../../../shared/utils/fp'

import type { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import { Tooltip } from '../tooltip/Tooltip'
import { MapChangesTooltip } from './MapChangesTooltip'
import { partitionStatsWrap } from './newPartitionStats'

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
  'grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] overflow-hidden rounded-lg bg-aram-stats text-2xs'

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
