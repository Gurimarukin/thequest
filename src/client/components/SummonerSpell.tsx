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
  /** @default 0 */
  haste?: number
  tooltipShouldHide?: boolean
  className?: string
  timerClassName?: string
}

export const SummonerSpell: React.FC<Props> = ({
  spell,
  haste = 0,
  tooltipShouldHide,
  className,
  timerClassName,
}) => {
  const { t } = useTranslation('common')
  const { assets } = useStaticData()

  // https://wiki.leagueoflegends.com/en-us/Haste#Formula
  const cooldown = spell.cooldown * (100 / (100 + haste))

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

      setRemainingSeconds(cooldown)
    } else {
      setRemainingSeconds(undefined)
    }
  }, [remainingSeconds, cooldown])

  const stopPropagation = useCallback((e: React.SyntheticEvent) => e.stopPropagation(), [])

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        // prevent drag and drop above
        onPointerDown={stopPropagation}
        className={cx('relative grid place-items-center', className)}
      >
        <img
          src={assets.summonerSpell(spell.id)}
          alt={t.spellIconAlt(spell.name)}
          className="size-full area-1"
        />

        {remainingSeconds !== undefined && (
          <span
            className={cx(
              'grid size-full place-items-center bg-black/50 font-lib-mono text-white shadow-black area-1 text-shadow',
              timerClassName,
            )}
          >
            <span className="-mx-96 area-1">{DayJs.Duration.formatSeconds(remainingSeconds)}</span>
          </span>
        )}
      </button>

      <Tooltip
        hoverRef={ref}
        shouldHide={tooltipShouldHide}
        className="grid max-w-xs grid-cols-[auto_auto] gap-1"
      >
        <span className="font-bold">{spell.name}</span>
        <span className="justify-self-end">{t.cooldownSeconds(cooldown, 'text-goldenrod')}</span>
        <span className="col-span-2 whitespace-normal">{spell.description}</span>
      </Tooltip>
    </>
  )
}
