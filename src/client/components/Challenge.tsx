import { number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import type { ChallengeId } from '../../shared/models/api/ChallengeId'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import { DictUtils } from '../../shared/utils/DictUtils'
import type { PartialDict } from '../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

const imgSrc = (id: ChallengeId, tier: LeagueTier): string =>
  `https://ddragon.leagueoflegends.com/cdn/img/challenges-images/${id}-${tier}.png`

type Props = {
  id: ChallengeId
  tier: Maybe<LeagueTier>
  value: Maybe<number>
  thresholds: PartialDict<LeagueTier, number>
  iconClassName?: string
}

export const Challenge: React.FC<Props> = ({
  id,
  tier,
  value: maybeValue,
  thresholds,
  iconClassName,
}) => {
  const { t } = useTranslation('common')

  const hoverRef = useRef<HTMLDivElement>(null)
  const placementRef = useRef<HTMLImageElement>(null)

  const src = imgSrc(
    id,
    pipe(
      tier,
      Maybe.getOrElse<LeagueTier>(() => 'BRONZE'),
    ),
  )
  const alt = t.challenge.iconAlt(id)

  const value = pipe(
    maybeValue,
    Maybe.getOrElse(() => 0),
  )
  const total = pipe(
    thresholds,
    DictUtils.partial.values,
    List.filter(n => value < n),
    NonEmptyArray.fromReadonlyArray,
    Maybe.map(NonEmptyArray.min(number.Ord)),
    Maybe.getOrElse(() => 0),
  )

  return (
    <>
      <div ref={hoverRef} className="flex items-center gap-2">
        <img
          ref={placementRef}
          src={src}
          alt={alt}
          className={cx(['grayscale', Maybe.isNone(tier)], iconClassName)}
        />
        <span>{t.fraction(value, total)}</span>
      </div>

      <Tooltip hoverRef={hoverRef} placementRef={placementRef} className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="pl-1 pt-1">
            <img
              src={src}
              alt={alt}
              className={cx('h-20 w-20', ['grayscale', Maybe.isNone(tier)])}
            />
          </div>

          <div className="flex flex-col self-center">
            <div className="flex items-baseline gap-2">
              <span>{t.challenge.challenge}</span>
              <h3 className="text-sm font-bold">{t.labels.challenge(id)}</h3>
            </div>
            <span className="pt-1 text-sm">{t.labels.challengeShort(id)}</span>
            <div className="flex gap-2 pt-2">
              {pipe(
                tier,
                Maybe.fold(
                  () => null,
                  t_ => <span>{t.labels.leagueTier[t_]}</span>,
                ),
              )}
              <span>{t.fraction(value, total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span>{t.challenge.thresholds}</span>
          <ul className="flex flex-wrap gap-1.5 italic">
            {pipe(thresholds, DictUtils.partial.entries, entries =>
              entries.map(([key, val], i) => (
                <li key={key}>
                  {t.challenge.valueTier(val ?? 0, key, { withComma: i !== entries.length - 1 })}
                </li>
              )),
            )}
          </ul>
        </div>
      </Tooltip>
    </>
  )
}