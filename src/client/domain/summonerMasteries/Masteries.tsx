/* eslint-disable functional/no-return-void */
import { number, ord, predicate, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'
import React, { Fragment, useMemo, useRef } from 'react'

import { Lane } from '../../../shared/models/api/Lane'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { cssClasses } from '../../utils/cssClasses'
import { ChampionMasterySquare, bgGradientMastery } from './ChampionMasterySquare'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { MasteriesFilters } from './filters/MasteriesFilters'

const { plural } = StringUtils

type Props = {
  masteries: List<EnrichedChampionMastery>
  setChampionShards: (champion: ChampionKey) => (count: number) => void
}

export const Masteries = ({ masteries, setChampionShards }: Props): JSX.Element => {
  const { masteriesQuery } = useHistory()
  const { champions } = useStaticData()

  const { filteredAndSortedMasteries, championsCount, searchCount, maybeMaxPoints } =
    useMemo(() => {
      const filterPredicate = pipe(
        levelFilterPredicate(masteriesQuery.level),
        predicate.and(laneFilterPredicate(masteriesQuery.lane)),
      )

      const filteredAndSortedMasteries_ = pipe(
        masteries,
        List.map(m =>
          filterPredicate(m) ? m : pipe(m, EnrichedChampionMastery.Lens.isHidden.set(true)),
        ),
        List.sortBy(
          ((): List<Ord<EnrichedChampionMastery>> => {
            switch (masteriesQuery.sort) {
              case 'percents':
                return [
                  reverseIfDesc(EnrichedChampionMastery.Ord.byPercents),
                  reverseIfDesc(EnrichedChampionMastery.Ord.byShards),
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

      return {
        filteredAndSortedMasteries: filteredAndSortedMasteries_,
        championsCount: pipe(
          filteredAndSortedMasteries_,
          List.filter(c => !c.isHidden),
          List.size,
        ),
        searchCount: pipe(
          filteredAndSortedMasteries_,
          List.filter(c => Maybe.isSome(c.glow)),
          List.size,
        ),
        maybeMaxPoints: pipe(
          filteredAndSortedMasteries_,
          NonEmptyArray.fromReadonlyArray,
          Maybe.map(
            flow(
              NonEmptyArray.map(c => c.championPoints + c.championPointsUntilNextLevel),
              NonEmptyArray.max(number.Ord),
            ),
          ),
        ),
      }

      function reverseIfDesc<A>(o: Ord<A>): Ord<A> {
        switch (masteriesQuery.order) {
          case 'asc':
            return o
          case 'desc':
            return ord.reverse(o)
        }
      }
    }, [
      masteries,
      masteriesQuery.level,
      masteriesQuery.lane,
      masteriesQuery.order,
      masteriesQuery.sort,
    ])

  const isHistogram = masteriesQuery.view === 'histogram'

  return (
    <>
      <MasteriesFilters
        championsCount={championsCount}
        totalChampionsCount={champions.length}
        searchCount={searchCount}
      />
      <div
        className={cssClasses(
          'self-center pt-4 pb-24',
          ['flex max-w-[104rem] flex-wrap justify-center gap-4', masteriesQuery.view === 'compact'],
          ['grid w-full max-w-7xl grid-cols-[auto_1fr] gap-y-2', isHistogram],
        )}
      >
        {filteredAndSortedMasteries.map(champion => (
          <Fragment key={ChampionKey.unwrap(champion.championId)}>
            <ChampionMasterySquare
              {...champion}
              setChampionShards={setChampionShards}
              isHistogram={isHistogram}
              className={cssClasses(['hidden', champion.isHidden])}
            />
            <ChampionMasteryHistogram
              maybeMaxPoints={maybeMaxPoints}
              champion={champion}
              className={cssClasses(['hidden', !isHistogram || champion.isHidden])}
            />
          </Fragment>
        ))}
      </div>
    </>
  )
}

const levelFilterPredicate =
  (levels: ReadonlySet<ChampionLevelOrZero>) =>
  (c: EnrichedChampionMastery): boolean =>
    readonlySet.elem(ChampionLevelOrZero.Eq)(c.championLevel, levels)

const laneFilterPredicate =
  (lanes: ReadonlySet<Lane>) =>
  (c: EnrichedChampionMastery): boolean =>
    pipe(
      c.lanes,
      List.some(lane => readonlySet.elem(Lane.Eq)(lane, lanes)),
    )

type ChampionMasteryHistogramProps = {
  maybeMaxPoints: Maybe<number>
  champion: EnrichedChampionMastery
  className?: string
}

const ChampionMasteryHistogram = ({
  maybeMaxPoints,
  champion: {
    championLevel,
    championPoints,
    championPointsSinceLastLevel,
    championPointsUntilNextLevel,
  },
  className,
}: ChampionMasteryHistogramProps): JSX.Element => {
  const hoverRef1 = useRef<HTMLDivElement>(null)
  const hoverRef2 = useRef<HTMLDivElement>(null)
  const hoverRef3 = useRef<HTMLDivElement>(null)
  const placementRef = useRef<HTMLSpanElement>(null)

  const pointsUntilAndSince = pipe(
    [
      2 < championLevel
        ? Maybe.some(
            `${plural('point')(championPointsSinceLastLevel)} depuis le niveau ${Math.min(
              championLevel,
              5,
            )}`,
          )
        : Maybe.none,
      0 < championLevel && championLevel < 5
        ? Maybe.some(
            `${plural('point')(championPointsUntilNextLevel)} jusqu'au niveau ${championLevel + 1}`,
          )
        : Maybe.none,
    ],
    List.compact,
    NonEmptyArray.fromReadonlyArray,
    Maybe.map(List.mkString(' — ')),
  )

  return (
    <>
      <div className={cssClasses('flex flex-col', className)}>
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
                      ref={hoverRef1}
                      className="h-full bg-gray-600 opacity-50"
                      style={{ width: p(championPoints + championPointsUntilNextLevel) }}
                    />
                  )}
                  <div
                    ref={hoverRef2}
                    className={cssClasses(
                      'absolute top-0 h-full',
                      bgGradientMastery(championLevel),
                    )}
                    style={{ width: p(championPoints) }}
                  />
                  {championLevel < 2 ? null : (
                    <div
                      ref={hoverRef3}
                      className={`absolute top-0 h-full border-r ${rulerColor(championLevel)}`}
                      style={{ width: p(championPoints - championPointsSinceLastLevel) }}
                    />
                  )}
                </div>
              )
            },
          ),
        )}
        <div className="flex items-center p-[6px] text-sm">
          <span ref={placementRef}>{championPoints.toLocaleString()}</span>
        </div>
      </div>
      {pipe(
        pointsUntilAndSince,
        Maybe.fold(
          () => null,
          tooltip => (
            <Tooltip
              hoverRef={[placementRef, hoverRef1, hoverRef2, hoverRef3]}
              // placementRef={placementRef} // or NonEmptyArray.head(hoverRef) if not defined
              placement="bottom-start"
              className="!text-2xs"
            >
              {tooltip}
            </Tooltip>
          ),
        ),
      )}
    </>
  )
}

const rulerColor = (level: number): string => {
  if (5 <= level && level <= 7) return 'border-gray-500'
  if (level === 4) return 'border-gray-400'
  return 'border-gray-500'
}
