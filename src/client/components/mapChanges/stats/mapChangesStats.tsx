import { separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { flow, identity, pipe } from 'fp-ts/function'
import { useMemo } from 'react'

import type { WikiStatsBalanceKey } from '../../../../shared/models/WikiStatsBalance'
import { WikiStatsBalance } from '../../../../shared/models/WikiStatsBalance'
import type {
  ChampionSpellHtml,
  MapChangesData,
} from '../../../../shared/models/api/MapChangesData'
import { SpellName } from '../../../../shared/models/api/SpellName'
import { Dict, Either, List, Maybe, NonEmptyArray } from '../../../../shared/utils/fp'

import { useTranslation } from '../../../contexts/TranslationContext'
import { Assets } from '../../../imgs/Assets'
import { type Translation } from '../../../models/Translation'
import { cx } from '../../../utils/cx'
import { partitionStats } from './partitionStats'

export type MapChangesStatsProps = {
  data: MapChangesData
  splitAt?: number
  /**
   * @default false
   */
  simpleStatsSpellsSplit?: boolean
  draggable?: boolean
  /**
   * @prop renderChildren
   * Called only if isSome(data.stats) or isSome(data.spells).
   */
  children: (
    children1: List<React.ReactElement>,
    children2: List<React.ReactElement>,
  ) => React.ReactElement
}

type RenderStat = (
  t: Translation,
  name: WikiStatsBalanceKey,
  draggable?: boolean,
) => (value: number) => React.ReactElement

type RenderSpell = (
  t: Translation,
  spell: SpellName,
) => (html: ChampionSpellHtml) => React.ReactElement

export const getMapChangesStats = (
  renderStat: RenderStat,
  renderSpell: RenderSpell,
  defaultSplitAt: number,
): React.FC<MapChangesStatsProps> => {
  const separateChildren = getSeparateChildren(renderStat, renderSpell)

  return ({
    data,
    splitAt = defaultSplitAt,
    simpleStatsSpellsSplit = false,
    draggable,
    children: renderChildren,
  }) => {
    const { t } = useTranslation()

    const maybeChildren = useMemo(
      () =>
        Maybe.isNone(data.stats) && Maybe.isNone(data.spells)
          ? Maybe.none
          : Maybe.some(separateChildren(t, data, splitAt, simpleStatsSpellsSplit, draggable)),
      [data, draggable, simpleStatsSpellsSplit, splitAt, t],
    )

    return pipe(
      maybeChildren,
      Maybe.fold(
        () => null,
        ({ left: children2, right: children1 }) => renderChildren(children1, children2),
      ),
    )
  }
}

const getSeparateChildren =
  (renderStat: RenderStat, renderSpell: RenderSpell) =>
  (
    t: Translation,
    data: MapChangesData,
    splitAt: number,
    simpleStatsSpellsSplit: boolean,
    draggable: boolean | undefined,
  ): Separated<List<React.ReactElement>, List<React.ReactElement>> => {
    const eithers = pipe(
      [
        pipe(
          data.stats,
          Maybe.chain(stats =>
            pipe(
              WikiStatsBalance.keys,
              List.filterMap(key =>
                pipe(
                  Dict.lookup(key, stats),
                  Maybe.map(
                    flow(renderStat(t, key, draggable), e =>
                      Either.right<React.ReactElement, React.ReactElement>(e),
                    ),
                  ),
                ),
              ),
              NonEmptyArray.fromReadonlyArray,
            ),
          ),
        ),
        pipe(
          data.spells,
          Maybe.chain(spells =>
            pipe(
              SpellName.values,
              List.filterMap(spell =>
                pipe(
                  Dict.lookup(spell, spells),
                  Maybe.map(
                    flow(renderSpell(t, spell), e =>
                      Either.left<React.ReactElement, React.ReactElement>(e),
                    ),
                  ),
                ),
              ),
              NonEmptyArray.fromReadonlyArray,
            ),
          ),
        ),
      ],
      List.compact,
      List.chain(identity),
    )

    if (simpleStatsSpellsSplit) {
      return List.separate(eithers)
    }

    const [children1, children2] = pipe(eithers, List.splitAt(splitAt))

    return pipe(
      partitionStats(children2),
      separated.map(tail =>
        pipe(children1, List.map(Either.getOrElse(identity)), List.concat(tail)),
      ),
    )
  }

export const renderStatIcon = (
  t: Translation['mapChanges'],
  name: WikiStatsBalanceKey,
  draggable?: boolean,
  className?: string,
): React.ReactElement => (
  <img
    src={Assets.stats[name]}
    alt={t.statIconAlt(name)}
    draggable={draggable}
    className={cx('bg-contain brightness-75 sepia', className)}
  />
)

export const renderStatValue = (
  name: WikiStatsBalanceKey,
  className?: string,
): ((value: number) => React.ReactElement) => {
  const isMalusStat = WikiStatsBalance.isMalusStat(name)
  const maybeUnit = WikiStatsBalance.isPercentsStat(name) ? Maybe.some('%') : Maybe.none

  return value => {
    const n = WikiStatsBalance.isModifierStat(name) ? (value * 1000 - 1000) / 10 : value
    return (
      <span
        className={cx(
          'flex justify-self-end font-lib-mono',
          (isMalusStat ? 0 < n : n < 0) ? 'text-red' : 'text-green',
          className,
        )}
      >
        <span>
          {n < 0 ? null : '+'}
          {n}
        </span>
        {pipe(
          maybeUnit,
          Maybe.fold(
            () => null,
            u => <span>{u}</span>,
          ),
        )}
      </span>
    )
  }
}
