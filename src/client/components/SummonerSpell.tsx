/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useCallback, useEffect, useRef, useState } from 'react'

import { DayJs } from '../../shared/models/DayJs'
import type { StaticDataSummonerSpell } from '../../shared/models/api/staticData/StaticDataSummonerSpell'

import { useStaticData } from '../contexts/StaticDataContext'
import { useTranslation } from '../contexts/TranslationContext'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

type Props = {
  spell: StaticDataSummonerSpell
  cooldownDisabled: boolean
  tooltipShouldHide?: boolean
  className?: string
}

export const SummonerSpell: React.FC<Props> = ({
  spell,
  cooldownDisabled,
  tooltipShouldHide,
  className,
}) => {
  const { t } = useTranslation('common')
  const { assets } = useStaticData()

  const ref = useRef<HTMLButtonElement>(null)

  const intervalId = useRef<number>()

  function clearInterval(): void {
    window.clearInterval(intervalId.current)
  }

  // clearInterval on unmount
  useEffect(() => clearInterval, [])

  const [remainingSeconds, setRemainingSeconds] = useState<number>()

  const onClick = useCallback(() => {
    if (intervalId.current !== undefined) {
      window.clearInterval(intervalId.current)
    }

    if (remainingSeconds === undefined) {
      // eslint-disable-next-line functional/immutable-data
      intervalId.current = window.setInterval(() => {
        setRemainingSeconds(n => {
          if (n === undefined) {
            return n
          }

          const newN = n - 1

          if (newN <= 0) {
            clearInterval()

            return undefined
          }

          return newN
        })
      }, 1000)

      setRemainingSeconds(spell.cooldown)
    } else {
      setRemainingSeconds(undefined)
    }
  }, [remainingSeconds, spell.cooldown])

  const stopPropagation = useCallback((e: React.SyntheticEvent) => e.stopPropagation(), [])

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        // prevent drag and drop above
        onPointerDown={!cooldownDisabled ? stopPropagation : undefined}
        disabled={cooldownDisabled}
        className={cx(
          'relative grid place-items-center',
          ['cursor-[inherit]', cooldownDisabled],
          className,
        )}
      >
        <img
          src={assets.summonerSpell(spell.id)}
          alt={t.spellIconAlt(spell.name)}
          className="size-full area-1"
        />

        {remainingSeconds !== undefined && (
          <>
            <span className="size-full bg-black/50 area-1" />
            <span className="absolute font-lib-mono text-white shadow-black text-shadow">
              {DayJs.Duration.formatSeconds(remainingSeconds)}
            </span>
          </>
        )}
      </button>

      <Tooltip
        hoverRef={ref}
        shouldHide={tooltipShouldHide}
        className="grid max-w-xs grid-cols-[auto_auto] gap-1"
      >
        <span className="font-bold">{spell.name}</span>
        <span className="justify-self-end">
          {t.cooldownSeconds(spell.cooldown, 'text-goldenrod')}
        </span>
        <span className="col-span-2 whitespace-normal">{spell.description}</span>
      </Tooltip>
    </>
  )
}
