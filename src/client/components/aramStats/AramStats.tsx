import { separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { flow, identity, pipe } from 'fp-ts/function'
import React, { useMemo } from 'react'

import type { AramData, ChampionSpellHtml } from '../../../shared/models/api/AramData'
import { Spell } from '../../../shared/models/api/Spell'
import type { WikiaStatsBalanceKey } from '../../../shared/models/wikia/WikiaStatsBalance'
import { WikiaStatsBalance } from '../../../shared/models/wikia/WikiaStatsBalance'
import { Dict, Either, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { Assets } from '../../imgs/Assets'
import { cssClasses } from '../../utils/cssClasses'
import { partitionStats } from './partitionStats'

export type AramStatsProps = {
  aram: AramData
  splitAt?: number
  /**
   * @default false
   */
  simpleStatsSpellsSplit?: boolean
  /**
   * @prop renderChildren
   * Called only if isSome(aram.stats) or isSome(aram.spells).
   */
  children: (children1: List<JSX.Element>, children2: List<JSX.Element>) => JSX.Element
}

type RenderStat = (name: WikiaStatsBalanceKey) => (value: number) => JSX.Element
type RenderSpell = (spell: Spell) => (html: ChampionSpellHtml) => JSX.Element

export const getAramStats = (
  renderStat: RenderStat,
  renderSpell: RenderSpell,
  defaultSplitAt: number,
): ((props: AramStatsProps) => JSX.Element | null) => {
  const separateChildren = getSeparateChildren(renderStat, renderSpell)
  return ({
    aram,
    splitAt = defaultSplitAt,
    simpleStatsSpellsSplit = false,
    children: renderChildren,
  }) => {
    const maybeChildren = useMemo(
      () =>
        Maybe.isNone(aram.stats) && Maybe.isNone(aram.spells)
          ? Maybe.none
          : Maybe.some(separateChildren(aram, splitAt, simpleStatsSpellsSplit)),
      [aram, simpleStatsSpellsSplit, splitAt],
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
    aram: AramData,
    splitAt: number,
    simpleStatsSpellsSplit: boolean,
  ): Separated<List<JSX.Element>, List<JSX.Element>> => {
    const eithers = pipe(
      [
        pipe(
          aram.stats,
          Maybe.chain(stats =>
            pipe(
              WikiaStatsBalance.keys,
              List.filterMap(key =>
                pipe(
                  Dict.lookup(key, stats),
                  Maybe.map(flow(renderStat(key), e => Either.right<JSX.Element, JSX.Element>(e))),
                ),
              ),
              NonEmptyArray.fromReadonlyArray,
            ),
          ),
        ),
        pipe(
          aram.spells,
          Maybe.chain(spells =>
            pipe(
              Spell.values,
              List.filterMap(spell =>
                pipe(
                  Dict.lookup(spell, spells),
                  Maybe.map(
                    flow(renderSpell(spell), e => Either.left<JSX.Element, JSX.Element>(e)),
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

export const renderStatIcon = (name: WikiaStatsBalanceKey, className?: string): JSX.Element => (
  <img
    src={Assets.stats[name]}
    alt={`Icône stat ${WikiaStatsBalance.label[name]}`}
    className={cssClasses('bg-contain brightness-75 sepia', className)}
  />
)

export const renderStatValue = (
  name: WikiaStatsBalanceKey,
  className?: string,
): ((value: number) => JSX.Element) => {
  const isMalusStat = WikiaStatsBalance.isMalusStat(name)
  const maybeUnit = WikiaStatsBalance.isPercentsStat(name) ? Maybe.some('%') : Maybe.none
  return value => {
    const n = WikiaStatsBalance.isModifierStat(name) ? (value * 1000 - 1000) / 10 : value
    return (
      <span
        className={cssClasses(
          'flex gap-0.5 justify-self-end font-mono',
          (isMalusStat ? 0 < n : n < 0) ? 'text-red-600' : 'text-green-600',
          className,
        )}
      >
        <span>
          {n < 0 ? '' : '+'}
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
