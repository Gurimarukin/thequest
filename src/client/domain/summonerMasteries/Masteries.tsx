/* eslint-disable functional/no-return-void */
import { number, ord, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'
import React, { Fragment, useMemo, useRef } from 'react'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray, Tuple } from '../../../shared/utils/fp'

import { Tooltip } from '../../components/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { cssClasses } from '../../utils/cssClasses'
import { ChampionMasterySquare, bgGradientMastery } from './ChampionMasterySquare'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { MasteriesFilters } from './MasteriesFilters'

const { plural } = StringUtils

type Props = {
  masteries: List<EnrichedChampionMastery>
  setChampionShards: (champion: ChampionKey) => (count: number) => void
}

export const Masteries = ({ masteries, setChampionShards }: Props): JSX.Element => {
  const { masteriesQuery } = useHistory()
  const { champions } = useStaticData()

  const [filteredAndSortedChampions, searchCount] = useMemo(() => {
    const filteredAndSortedChampions_ = pipe(
      masteries,
      List.filter(levelFilterPredicate(masteriesQuery.level)),
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

    return Tuple.of(
      filteredAndSortedChampions_,
      pipe(
        filteredAndSortedChampions_,
        List.filter(c => Maybe.isSome(c.glow)),
        List.size,
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
      <MasteriesFilters
        championsCount={filteredAndSortedChampions.length}
        totalChampionsCount={champions.length}
        searchCount={searchCount}
      />
      {renderChampionMasteries(masteriesQuery.view, filteredAndSortedChampions, setChampionShards)}
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
  setChampionShards: (champion: ChampionKey) => (count: number) => void,
): JSX.Element => {
  switch (view) {
    case 'compact':
      return (
        <ChampionMasteriesCompact champions={champions} setChampionShards={setChampionShards} />
      )
    case 'histogram':
      return (
        <ChampionMasteriesHistogram champions={champions} setChampionShards={setChampionShards} />
      )
  }
}

type ChampionMasteriesCompactProps = {
  champions: List<EnrichedChampionMastery>
  setChampionShards: (champion: ChampionKey) => (count: number) => void
}

const ChampionMasteriesCompact = ({
  champions,
  setChampionShards,
}: ChampionMasteriesCompactProps): JSX.Element => (
  <div className="flex max-w-[104rem] flex-wrap justify-center gap-4 self-center pt-4 pb-24">
    {champions.map(champion => (
      <ChampionMasterySquare
        key={ChampionKey.unwrap(champion.championId)}
        {...champion}
        setChampionShards={setChampionShards}
      />
    ))}
  </div>
)

type ChampionMasteriesHistogramProps = {
  champions: List<EnrichedChampionMastery>
  setChampionShards: (champion: ChampionKey) => (count: number) => void
}

const ChampionMasteriesHistogram = ({
  champions,
  setChampionShards,
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
    <div className="grid w-full max-w-7xl grid-cols-[auto_1fr] gap-y-2 self-center pt-4 pb-24">
      {champions.map(champion => (
        <Fragment key={ChampionKey.unwrap(champion.championId)}>
          <ChampionMasterySquare
            {...champion}
            setChampionShards={setChampionShards}
            isHistogram={true}
          />
          <ChampionMasteryHistogram maybeMaxPoints={maybeMaxPoints} champion={champion} />
        </Fragment>
      ))}
    </div>
  )
}

type ChampionMasteryHistogramProps = {
  maybeMaxPoints: Maybe<number>
  champion: EnrichedChampionMastery
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
  const hoverRef = useRef<HTMLDivElement>(null)
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
      <div ref={hoverRef} className="flex flex-col">
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
                      className="h-full bg-gray-600 opacity-50"
                      style={{ width: p(championPoints + championPointsUntilNextLevel) }}
                    />
                  )}
                  <div
                    className={cssClasses(
                      'absolute top-0 h-full',
                      bgGradientMastery(championLevel),
                    )}
                    style={{ width: p(championPoints) }}
                  />
                  {championLevel < 2 ? null : (
                    <div
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
          <span ref={placementRef}>{championPoints.toLocaleString()}</span>
        </div>
      </div>
      {pipe(
        pointsUntilAndSince,
        Maybe.fold(
          () => null,
          tooltip => (
            <Tooltip
              hoverRef={hoverRef}
              placementRef={placementRef}
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
