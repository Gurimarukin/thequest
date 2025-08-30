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

  const nonEmpty =
    List.isNonEmpty(primaryPath) || List.isNonEmpty(secondaryPath) || List.isNonEmpty(shards)

  return (
    <div
      className={cx(
        'relative flex min-h-[4.25rem] gap-1.5',
        reverse ? 'flex-row-reverse items-end' : 'items-start',
      )}
    >
      <div
        className={cx('grid gap-2', nonEmpty ? (reverse ? 'pr-1' : 'pl-1') : undefined)}
        style={
          reverse
            ? {
                gridTemplateAreas: '"shards" "secondary" "primary"',
                gridTemplateRows: '.75rem 1.25rem 1.25rem',
              }
            : {
                gridTemplateAreas: '"primary" "secondary" "shards"',
                gridTemplateRows: '1.25rem 1.25rem .75rem',
              }
        }
      >
        <RunePath
          runes={primaryPath}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className="gap-1 area-[primary]"
        />
        <RunePath
          runes={secondaryPath}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className="gap-1 area-[secondary]"
        />
        <RunePath
          runes={shards}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={draggable}
          className="gap-1.5 area-[shards]"
          liClassName="!w-3 h-3 overflow-hidden"
          runeClassName="!w-[calc(100%_+_8px)] -m-1 max-w-none"
        />
      </div>

      {List.isEmpty(secondaryPath) &&
        pipe(
          runeStyleById(perks.perkSubStyle),
          Maybe.fold(
            () => null,
            rune => (
              <div className={cx('absolute size-5', reverse ? 'left-4 top-1' : 'bottom-1 right-4')}>
                <Rune
                  icon={rune.icon}
                  name={rune.name}
                  tooltipShouldHide={tooltipShouldHide}
                  draggable={draggable}
                  className="w-full"
                />
              </div>
            ),
          ),
        )}

      {pipe(
        keyStone,
        Maybe.fold(
          () => null,
          r => (
            <span className={cx('flex size-9', reverse ? '-mb-1.5' : '-mt-1.5')}>
              <Rune
                icon={r.iconPath}
                name={r.name}
                description={r.longDesc}
                tooltipShouldHide={tooltipShouldHide}
                draggable={draggable}
                className="w-full"
              />
            </span>
          ),
        ),
      )}
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
