import { useRef } from 'react'

import { useTranslation } from '../contexts/TranslationContext'
import { InformationCircleOutline } from '../imgs/svgs/icons'
import type { MapChangesChampionCategory } from '../models/MapChangesChampionCategory'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

type ChampionCategoryTitleProps = {
  category: MapChangesChampionCategory
  className?: string
}

export const ChampionCategoryTitle: React.FC<ChampionCategoryTitleProps> = ({
  category,
  className,
}) => {
  const { t } = useTranslation('mapChanges')

  const hoverRef = useRef<HTMLHeadingElement>(null)
  const placementRef = useRef<HTMLSpanElement>(null)

  return (
    <div className={cx('col-span-full flex pb-1', className)}>
      <h2 ref={hoverRef} className="flex items-center gap-2 font-semibold">
        <span>{t.category.label[category]}</span>
        <span ref={placementRef}>
          <InformationCircleOutline className="h-4" />
        </span>
        <Tooltip
          hoverRef={hoverRef}
          placementRef={placementRef}
          className="max-w-xl !whitespace-normal break-normal py-2"
        >
          {t.category.description[category]}
        </Tooltip>
      </h2>
    </div>
  )
}
