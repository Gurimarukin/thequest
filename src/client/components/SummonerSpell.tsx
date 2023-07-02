import { useRef } from 'react'

import type { StaticDataSummonerSpell } from '../../shared/models/api/staticData/StaticDataSummonerSpell'

import { useStaticData } from '../contexts/StaticDataContext'
import { useTranslation } from '../contexts/TranslationContext'
import { Tooltip } from './tooltip/Tooltip'

type Props = {
  spell: StaticDataSummonerSpell
  className?: string
}

export const SummonerSpell: React.FC<Props> = ({ spell, className }) => {
  const { t } = useTranslation('common')
  const { assets } = useStaticData()

  const ref = useRef<HTMLImageElement>(null)

  return (
    <>
      <img
        ref={ref}
        src={assets.summonerSpell(spell.id)}
        alt={t.spellIconAlt(spell.name)}
        className={className}
      />
      <Tooltip hoverRef={ref} className="grid max-w-xs grid-cols-[auto_auto] gap-1">
        <span className="font-bold">{spell.name}</span>
        <span className="justify-self-end">
          {t.cooldownSeconds(spell.cooldown, 'text-goldenrod')}
        </span>
        <span className="col-span-2 whitespace-normal">{spell.description}</span>
      </Tooltip>
    </>
  )
}
