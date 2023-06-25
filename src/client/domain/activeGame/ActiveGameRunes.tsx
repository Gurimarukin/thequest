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
}

export const ActiveGameRunes: React.FC<Props> = ({ runeStyleById, runeById, perks, reverse }) => {
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
    <div className={cx('flex gap-1.5', ['flex-row-reverse', reverse])}>
      <div className={cx('flex flex-col gap-2', reverse ? 'pr-1' : 'pl-1')}>
        <RunePath runes={primaryPath} reverse={reverse} className="gap-1" />
        <RunePath runes={secondaryPath} reverse={reverse} className="gap-1" />
        <RunePath
          runes={shards}
          reverse={!reverse}
          className="justify-end gap-1.5"
          liClassName="!w-3 h-3 overflow-hidden"
          runeClassName="!w-[calc(100%_+_8px)] -m-1 max-w-none"
        />
      </div>
      <span className="-mt-1.5 flex h-9 w-9">
        {pipe(
          keyStone,
          Maybe.fold(
            () => <div className="h-full w-full bg-black" />,
            r => (
              <Rune icon={r.iconPath} name={r.name} description={r.longDesc} className="w-full" />
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
  className?: string
  liClassName?: string
  runeClassName?: string
}

const RunePath: React.FC<RunePathProps> = ({
  runes,
  reverse,
  className,
  liClassName,
  runeClassName,
}) => (
  <ul className={cx('flex', ['flex-row-reverse', reverse], className)}>
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
          className={cx('w-full', runeClassName)}
        />
      </li>
    ))}
  </ul>
)
