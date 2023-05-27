import { flow, pipe } from 'fp-ts/function'
import { useMemo } from 'react'

import type { PerksView } from '../../../shared/models/api/perk/PerksView'
import { RuneId } from '../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import { List, Maybe } from '../../../shared/utils/fp'

import { Rune } from '../../components/Rune'
import { cx } from '../../utils/cx'

type Props = {
  runeStyles: List<StaticDataRuneStyle>
  runes: List<StaticDataRune>
  perks: PerksView
  reverse: boolean
}

export const ActiveGameRunes: React.FC<Props> = ({ runeStyles, runes, perks, reverse }) => {
  const { keyStone, primaryPath, secondaryPath, shards } = useMemo(() => {
    const findRunes = getFindRunes(runeStyles, runes, perks.perkIds)

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
      shards: pipe(
        perks.perkIds,
        List.difference(RuneId.Eq)(pathIds),
        List.filterMap(runeId =>
          pipe(
            runes,
            List.findFirst(rune => RuneId.Eq.equals(rune.id, runeId)),
          ),
        ),
      ),
    }
  }, [perks, runeStyles, runes])

  return (
    <>
      <RunePath
        runes={shards}
        className="flex flex-col gap-1"
        liClassName="!w-3 h-3 overflow-hidden"
        runeClassName="!w-[calc(100%_+_8px)] -m-1 max-w-none"
      />
      <div>
        <RunePath
          runes={primaryPath}
          className={cx('flex items-center justify-end gap-1', ['flex-row-reverse', !reverse])}
        />
        <RunePath
          runes={secondaryPath}
          className={cx('flex justify-end gap-1', ['flex-row-reverse', !reverse])}
        />
      </div>
      <span className="h-10 w-10 rounded-sm">
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
    </>
  )
}

const getFindRunes =
  (runeStyles: List<StaticDataRuneStyle>, runes: List<StaticDataRune>, runeIds: List<RuneId>) =>
  (styleId: RuneStyleId): List<StaticDataRune> => {
    const runesInStyle = pipe(
      runeStyles,
      List.findFirst(s => RuneStyleId.Eq.equals(s.id, styleId)),
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
          Maybe.chain(runeId =>
            pipe(
              runes,
              List.findFirst(rune => RuneId.Eq.equals(rune.id, runeId)),
            ),
          ),
        ),
      ),
    )
  }

type RunePathProps = {
  runes: List<StaticDataRune>
  className?: string
  liClassName?: string
  runeClassName?: string
}

const RunePath: React.FC<RunePathProps> = ({ runes, className, liClassName, runeClassName }) => (
  <ul className={className}>
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
