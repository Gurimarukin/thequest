import { flow, pipe } from 'fp-ts/function'
import { useMemo } from 'react'

import type { PerksView } from '../../../shared/models/api/perk/PerksView'
import { RuneId } from '../../../shared/models/api/perk/RuneId'
import type { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import { List, Maybe } from '../../../shared/utils/fp'

import { Rune } from '../../components/Rune'
import { cx } from '../../utils/cx'

type Props = {
  runeStyleById: (id: RuneStyleId) => Maybe<StaticDataRuneStyle>
  runeById: (id: RuneId) => Maybe<StaticDataRune>
  perks: PerksView
  reverse: boolean
  tooltipShouldHide?: boolean
  draggable?: boolean
}

export const ActiveGameRunes: React.FC<Props> = ({
  runeStyleById,
  runeById,
  perks,
  reverse,
  tooltipShouldHide,
  draggable,
}) => {
  const { keyStone, primaryPath, secondaryPath, shards } = useMemo(() => {
    const findRunes = getFindRunes(runeStyleById, runeById, perks.perkIds)

    const primaryPath_ = findRunes(perks.perkStyle)
    const secondaryPath_ = findRunes(perks.perkSubStyle)

    const pathIds = pipe(
      primaryPath_,
      List.concat(secondaryPath_),
      List.map(rune => rune.id),
    )

    return {
      keyStone: List.head(primaryPath_),
      primaryPath: pipe(
        List.tail(primaryPath_),
        Maybe.getOrElseW(() => []),
      ),
      secondaryPath: secondaryPath_,
      shards: pipe(perks.perkIds, List.difference(RuneId.Eq)(pathIds), List.filterMap(runeById)),
    }
  }, [perks, runeById, runeStyleById])

  return (
    <div className={cx('flex gap-1.5', reverse ? 'flex-row-reverse items-end' : 'items-start')}>
      <div className={cx('flex gap-2', reverse ? 'flex-col-reverse pr-1' : 'flex-col pl-1')}>
        <RunePath
          runes={primaryPath}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className="gap-1"
        />
        <RunePath
          runes={secondaryPath}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className="gap-1"
        />
        <RunePath
          runes={shards}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className="gap-1.5"
          liClassName="!w-3 h-3 overflow-hidden"
          runeClassName="!w-[calc(100%_+_8px)] -m-1 max-w-none"
        />
      </div>
      <span className={cx('flex h-9 w-9', reverse ? '-mb-1.5' : '-mt-1.5')}>
        {pipe(
          keyStone,
          Maybe.fold(
            () => <div className="size-full bg-black" />,
            r => (
              <Rune
                icon={r.iconPath}
                name={r.name}
                description={r.longDesc}
                tooltipShouldHide={tooltipShouldHide}
                draggable={draggable}
                className="w-full"
              />
            ),
          ),
        )}
      </span>
    </div>
  )
}

const getFindRunes =
  (
    runeStyleById: (id: RuneStyleId) => Maybe<StaticDataRuneStyle>,
    runeById: (id: RuneId) => Maybe<StaticDataRune>,
    runeIds: List<RuneId>,
  ) =>
  (styleId: RuneStyleId): List<StaticDataRune> => {
    const runesInStyle = pipe(
      runeStyleById(styleId),
      Maybe.fold(
        () => [],
        style =>
          pipe(
            style.slots,
            List.chain(slot => slot.runes),
          ),
      ),
    )

    return pipe(
      runeIds,
      List.filterMap(
        flow(
          Maybe.fromPredicate(runeId => List.elem(RuneId.Eq)(runeId, runesInStyle)),
          Maybe.chain(runeById),
        ),
      ),
    )
  }

type RunePathProps = {
  runes: List<StaticDataRune>
  reverse: boolean
  tooltipShouldHide?: boolean
  draggable?: boolean
  className?: string
  liClassName?: string
  runeClassName?: string
}

const RunePath: React.FC<RunePathProps> = ({
  runes,
  reverse,
  tooltipShouldHide,
  draggable,
  className,
  liClassName,
  runeClassName,
}) => (
  <ul className={cx('flex justify-end', ['flex-row-reverse', !reverse], className)}>
    {runes.map((r, i) => (
      <li
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        className={cx('w-5', liClassName)}
      >
        <Rune
          icon={r.iconPath}
          name={r.name}
          description={r.longDesc}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className={cx('w-full', runeClassName)}
        />
      </li>
    ))}
  </ul>
)
