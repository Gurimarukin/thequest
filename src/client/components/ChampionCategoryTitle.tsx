import { useRef } from 'react'

import type { Dict } from '../../shared/utils/fp'

import { InformationCircleOutline } from '../imgs/svgIcons'
import type { ChampionCategory } from '../models/ChampionCategory'
import { cssClasses } from '../utils/cssClasses'
import { Tooltip } from './tooltip/Tooltip'

type ChampionCategoryTitleProps = {
  category: ChampionCategory
  className?: string
}

export const ChampionCategoryTitle: React.FC<ChampionCategoryTitleProps> = ({
  category,
  className,
}) => {
  const infoRef = useRef<HTMLSpanElement>(null)
  return (
    <h2
      className={cssClasses('col-span-full flex w-full items-center gap-2 pb-1 text-sm', className)}
    >
      <span>{label[category]}</span>
      <span ref={infoRef}>
        <InformationCircleOutline className="h-4" />
      </span>
      <Tooltip hoverRef={infoRef} className="max-w-xl !whitespace-normal break-normal py-2">
        {tooltip[category]}
      </Tooltip>
    </h2>
  )
}

const label: Dict<ChampionCategory, string> = {
  buffed: 'Champions buffés',
  nerfed: 'Champions nerfés',
  other: 'Autres',
  balanced: 'Champions parfaitement équilibrés',
}

const tooltip: Dict<ChampionCategory, string> = {
  buffed: 'Champions avec plus de buffs que de nerfs',
  nerfed: 'Champions avec plus de nerfs que de buffs',
  other:
    "Champions avec autant de buffs que de nerfs (ou avec des modifications de compétences pour lesquelles il est difficile de déterminer automatiquement si c'est un buff ou un nerf 🙃)",
  balanced: 'Champions avec aucun équilibrage',
}
