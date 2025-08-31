import { useRef } from 'react'

import { DDragonUtils } from '../../shared/utils/DDragonUtils'

import { useTranslation } from '../contexts/TranslationContext'
import { Tooltip } from './tooltip/Tooltip'

const base = DDragonUtils.ddragon('/cdn/img/')

type Props = {
  icon: string
  name: string
  description?: string
  tooltipShouldHide?: boolean
  className?: string
}

export const Rune: React.FC<Props> = ({
  icon,
  name,
  description,
  tooltipShouldHide,
  className,
}) => {
  const { t } = useTranslation('common')

  const ref = useRef<HTMLImageElement>(null)

  return (
    <>
      <img ref={ref} src={`${base}${icon}`} alt={t.runeIconAlt(name)} className={className} />
      <Tooltip
        hoverRef={ref}
        shouldHide={tooltipShouldHide}
        className="flex max-w-xs flex-col gap-1"
      >
        <span className="font-bold">{name}</span>
        {description !== undefined && (
          <span dangerouslySetInnerHTML={{ __html: description }} className="whitespace-normal" />
        )}
      </Tooltip>
    </>
  )
}
