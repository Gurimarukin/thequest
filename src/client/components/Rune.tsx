import { useRef } from 'react'

import { useTranslation } from '../contexts/TranslationContext'
import { Tooltip } from './tooltip/Tooltip'

const base = 'https://ddragon.leagueoflegends.com/cdn/img/'

type Props = {
  icon: string
  name: string
  description: string
  className?: string
}

export const Rune: React.FC<Props> = ({ icon, name, description, className }) => {
  const { t } = useTranslation('common')

  const ref = useRef<HTMLImageElement>(null)

  return (
    <>
      <img ref={ref} src={`${base}${icon}`} alt={t.runeIconAlt(name)} className={className} />
      <Tooltip hoverRef={ref} className="flex max-w-xs flex-col gap-1">
        <span className="font-bold">{name}</span>
        <span dangerouslySetInnerHTML={{ __html: description }} className="whitespace-normal" />
      </Tooltip>
    </>
  )
}
