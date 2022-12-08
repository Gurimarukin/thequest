import { number, ord, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'
import React, { Fragment, useMemo } from 'react'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { ChampionMasterySquare } from './ChampionMasterySquare'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { MasteriesFilters } from './MasteriesFilters'

type Props = {
  readonly masteries: List<EnrichedChampionMastery>
}

export const Masteries = ({ masteries }: Props): JSX.Element => {
  const { masteriesQuery } = useHistory()

  const filteredAndSortedChampions = useMemo(() => {
    return pipe(
      masteries,
      List.filter(levelFilterPredicate(masteriesQuery.level)),
      List.sortBy(
        ((): List<Ord<EnrichedChampionMastery>> => {
          switch (masteriesQuery.sort) {
            case 'percents':
              return [
                reverseIfDesc(EnrichedChampionMastery.Ord.byPercents),
                /* TODO: ordByFragment, */
                reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
                EnrichedChampionMastery.Ord.byName,
              ]
            case 'points':
              return [
                reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
                EnrichedChampionMastery.Ord.byName,
              ]
            case 'name':
              return [reverseIfDesc(EnrichedChampionMastery.Ord.byName)]
          }
        })(),
      ),
    )

    function reverseIfDesc<A>(o: Ord<A>): Ord<A> {
      switch (masteriesQuery.order) {
        case 'asc':
          return o
        case 'desc':
          return ord.reverse(o)
      }
    }
  }, [masteries, masteriesQuery.level, masteriesQuery.order, masteriesQuery.sort])

  return (
    <>
      <MasteriesFilters />
      <div className="flex justify-center">
        {filteredAndSortedChampions.length} champion
        {filteredAndSortedChampions.length < 2 ? null : 's'}
      </div>
      {renderChampionMasteries(masteriesQuery.view, filteredAndSortedChampions)}
    </>
  )
}

const levelFilterPredicate =
  (levels: ReadonlySet<ChampionLevelOrZero>) =>
  (c: EnrichedChampionMastery): boolean =>
    readonlySet.elem(ChampionLevelOrZero.Eq)(c.championLevel, levels)

const renderChampionMasteries = (
  view: MasteriesQueryView,
  champions: List<EnrichedChampionMastery>,
): JSX.Element => {
  switch (view) {
    case 'compact':
      return <ChampionMasteriesCompact champions={champions} />
    case 'histogram':
      return <ChampionMasteriesHistogram champions={champions} />
  }
}

type ChampionMasteriesCompactProps = {
  readonly champions: List<EnrichedChampionMastery>
}

const ChampionMasteriesCompact = ({ champions }: ChampionMasteriesCompactProps): JSX.Element => (
  <div className="flex flex-wrap gap-4 pt-4 pb-2">
    {champions.map(champion => (
      <ChampionMasterySquare key={ChampionKey.unwrap(champion.championId)} champion={champion} />
    ))}
  </div>
)

type ChampionMasteriesHistogramProps = {
  readonly champions: List<EnrichedChampionMastery>
}

const ChampionMasteriesHistogram = ({
  champions,
}: ChampionMasteriesHistogramProps): JSX.Element => {
  const maybeMaxPoints = useMemo(
    () =>
      pipe(
        champions,
        NonEmptyArray.fromReadonlyArray,
        Maybe.map(
          flow(
            NonEmptyArray.map(c => c.championPoints + c.championPointsUntilNextLevel),
            NonEmptyArray.max(number.Ord),
          ),
        ),
      ),
    [champions],
  )

  return (
    <div className="grid w-full max-w-7xl grid-cols-[auto_1fr] gap-y-2 self-center pt-4 pb-2">
      {champions.map(champion => (
        <Fragment key={ChampionKey.unwrap(champion.championId)}>
          <ChampionMasterySquare champion={champion} />
          <ChampionMasteryHistogram maybeMaxPoints={maybeMaxPoints} champion={champion} />
        </Fragment>
      ))}
    </div>
  )
}

type ChampionMasteryHistogramProps = {
  readonly maybeMaxPoints: Maybe<number>
  readonly champion: EnrichedChampionMastery
}

const ChampionMasteryHistogram = ({
  maybeMaxPoints,
  champion: {
    championLevel,
    championPoints,
    championPointsSinceLastLevel,
    championPointsUntilNextLevel,
  },
}: ChampionMasteryHistogramProps): JSX.Element => {
  const pointsUntilAndSince = pipe(
    [
      Maybe.some(pointsStr(championPoints)),
      2 < championLevel
        ? Maybe.some(
            `${pointsStr(championPointsSinceLastLevel)} depuis le niveau ${Math.min(
              championLevel,
              5,
            )}`,
          )
        : Maybe.none,
      0 < championLevel && championLevel < 5
        ? Maybe.some(
            `${pointsStr(championPointsUntilNextLevel)} jusqu'au niveau ${championLevel + 1}`,
          )
        : Maybe.none,
    ],
    List.compact,
    List.mkString(' - '),
  )

  return (
    <div className="flex flex-col">
      {pipe(
        maybeMaxPoints,
        Maybe.fold(
          () => null,
          maxPoints => {
            const p = (n: number): string => `${Math.round((100 * n) / maxPoints)}%`
            return (
              <div className="relative h-7">
                {championPointsUntilNextLevel === 0 ? null : (
                  <div
                    title={pointsUntilAndSince}
                    className="h-full bg-gray-600 opacity-50"
                    style={{ width: p(championPoints + championPointsUntilNextLevel) }}
                  />
                )}
                <div
                  title={pointsUntilAndSince}
                  className={`absolute top-0 h-full ${bgColor(championLevel)}`}
                  style={{ width: p(championPoints) }}
                />
                {championLevel < 2 ? null : (
                  <div
                    title={pointsUntilAndSince}
                    className={`absolute top-0 h-full border-r ${rulerColor(championLevel)}`}
                    style={{ width: p(championPoints - championPointsSinceLastLevel) }}
                  />
                )}
              </div>
            )
          },
        ),
      )}
      <div className="flex grow items-center p-1 text-sm">
        <span title={pointsUntilAndSince}>{championPoints.toLocaleString()}</span>
      </div>
    </div>
  )
}

const bgColor = (level: number): string => {
  if (level === 7) return 'bg-gradient-to-r from-mastery7-blue to-mastery7-blue-secondary'
  if (level === 6) return 'bg-gradient-to-r from-mastery6-violet to-mastery6-violet-secondary'
  if (level === 5) return 'bg-gradient-to-r from-mastery5-red to-mastery5-red-secondary'
  if (level === 4) return 'bg-gradient-to-r from-mastery4-brown to-mastery4-brown-secondary'
  return 'bg-mastery-beige'
}

const rulerColor = (level: number): string => {
  if (5 <= level && level <= 7) return 'border-gray-500'
  if (level === 4) return 'border-gray-400'
  return 'border-gray-500'
}

const pointsStr = (n: number): string => `${n.toLocaleString()} point${n < 2 ? '' : 's'}`
