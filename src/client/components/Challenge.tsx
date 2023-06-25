import { number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import { DictUtils } from '../../shared/utils/DictUtils'
import type { PartialDict } from '../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import type { ChallengeId } from '../../server/models/riot/ChallengId'

import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

const imgSrc = (id: ChallengeId, tier: LeagueTier): string =>
  `https://ddragon.leagueoflegends.com/cdn/img/challenges-images/${id}-${tier}.png`

type Props = {
  id: ChallengeId
  name: React.ReactNode
  description: React.ReactNode
  tier: Maybe<LeagueTier>
  value: Maybe<number>
  thresholds: PartialDict<LeagueTier, number>
  iconClassName?: string
}

export const Challenge: React.FC<Props> = ({
  id,
  name,
  description,
  tier,
  value: maybeValue,
  thresholds,
  iconClassName,
}) => {
  const hoverRef = useRef<HTMLDivElement>(null)
  const placementRef = useRef<HTMLImageElement>(null)

  const src = imgSrc(
    id,
    pipe(
      tier,
      Maybe.getOrElse<LeagueTier>(() => 'BRONZE'),
    ),
  )

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
          alt={`Icône défi ${id}`}
          className={cx(['grayscale', Maybe.isNone(tier)], iconClassName)}
        />
        <span>
          {value} / {total}
        </span>
      </div>

      <Tooltip hoverRef={hoverRef} placementRef={placementRef} className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="pl-1 pt-1">
            <img
              src={src}
              alt={`Icône défi ${id}`}
              className={cx('h-20 w-20', ['grayscale', Maybe.isNone(tier)])}
            />
          </div>

          <div className="flex flex-col self-center">
            <div className="flex items-baseline gap-2">
              <span>Défi</span>
              <h3 className="text-sm font-bold">{name}</h3>
            </div>
            <span className="pt-1 text-sm">{description}</span>
            <div className="flex gap-2 pt-2">
              <span>
                {value} / {total}
              </span>
              {pipe(
                tier,
                Maybe.fold(
                  () => null,
                  t => <span>({LeagueTier.label[t]})</span>,
                ),
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span>Seuils :</span>
          <ul className="flex flex-wrap gap-1.5 italic">
            {pipe(thresholds, DictUtils.partial.entries, entries =>
              entries.map(([key, val], i) => (
                <li key={key}>
                  {val} : {LeagueTier.label[key]}
                  {i === entries.length - 1 ? null : ','}
                </li>
              )),
            )}
          </ul>
        </div>
      </Tooltip>
    </>
  )
}
