import { separated } from 'fp-ts'
import { flow, identity, pipe } from 'fp-ts/function'
import React from 'react'

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
  className1?: string
  className2?: string
}

export const getAramStats =
  (
    renderStat: (name: WikiaStatsBalanceKey) => (value: number) => JSX.Element,
    renderSpell: (spell: Spell) => (html: ChampionSpellHtml) => JSX.Element,
    splitAt: number,
  ) =>
  ({ aram, className1, className2 }: AramStatsProps): JSX.Element | null => {
    if (Maybe.isNone(aram.stats) && Maybe.isNone(aram.spells)) return null

    const [children1_, children2_] = pipe(
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
      List.splitAt(splitAt),
    )

    const { left: children2, right: children1 } = pipe(
      partitionStats(children2_),
      separated.map(tail =>
        pipe(children1_, List.map(Either.getOrElse(identity)), List.concat(tail)),
      ),
    )

    return (
      <>
        <ul className={className1}>{children1}</ul>
        {List.isNonEmpty(children2) ? <ul className={className2}>{children2}</ul> : null}
      </>
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
          ['text-green-600', isMalusStat ? n < 0 : 0 < n],
          ['text-red-600', isMalusStat ? 0 < n : n < 0],
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
