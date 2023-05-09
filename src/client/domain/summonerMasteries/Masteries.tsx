/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { io, number, ord, predicate, random, readonlySet } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'
import { useMemo, useRef } from 'react'

import type { AramData } from '../../../shared/models/api/AramData'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { AramStatsCompact } from '../../components/aramStats/AramStatsCompact'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { ChampionCategory } from '../../models/ChampionCategory'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { NumberUtils } from '../../utils/NumberUtils'
import { cssClasses } from '../../utils/cssClasses'
import { ChampionMasterySquare } from './ChampionMasterySquare'
import { bgGradientMastery } from './ChampionTooltip'
import { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { MasteriesFilters } from './filters/MasteriesFilters'

const { round } = NumberUtils
const { plural } = StringUtils

type Props = {
  masteries: List<EnrichedChampionMastery>
  setChampionShards: (champion: ChampionKey) => (count: number) => void
}

export const Masteries: React.FC<Props> = ({ masteries, setChampionShards }) => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()
  const { champions } = useStaticData()

  const { filteredAndSortedMasteries, championsCount, searchCount, maybeMaxPoints } =
    useMemo(() => {
      const filterPredicate = pipe(
        levelFilterPredicate(masteriesQuery.level),
        predicate.and(positionFilterPredicate(masteriesQuery.position)),
        predicate.and(
          histogramOrAramSearchFilterPredicate(masteriesQuery.view, masteriesQuery.search),
        ),
      )

      const filteredAndSortedMasteries_ = pipe(
        masteries,
        List.map(m =>
          filterPredicate(m) ? m : pipe(m, EnrichedChampionMastery.Lens.isHidden.set(true)),
        ),
        List.sortBy(getSortBy(masteriesQuery.sort, masteriesQuery.order, masteriesQuery.view)),
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
    }, [
      masteries,
      masteriesQuery.level,
      masteriesQuery.order,
      masteriesQuery.position,
      masteriesQuery.search,
      masteriesQuery.sort,
      masteriesQuery.view,
    ])

  const randomChampion = useMemo(
    (): Maybe<() => string> =>
      pipe(
        filteredAndSortedMasteries,
        List.filter(m => !m.isHidden),
        NonEmptyArray.fromReadonlyArray,
        Maybe.map(
          flow(
            random.randomElem,
            io.map(m => {
              updateMasteriesQuery(MasteriesQuery.Lens.search.set(Maybe.some(m.name)))
              return m.name
            }),
          ),
        ),
      ),
    [filteredAndSortedMasteries, updateMasteriesQuery],
  )

  return (
    <>
      <MasteriesFilters searchCount={searchCount} randomChampion={randomChampion} />
      <div className={cssClasses('w-full', viewContainerClassName(masteriesQuery.view))}>
        {pipe(
          filteredAndSortedMasteries,
          ListUtils.mapWithPrevious((maybePrev, champion) => (
            <Champion
              key={ChampionKey.unwrap(champion.championId)}
              maybeMaxPoints={maybeMaxPoints}
              maybePrev={maybePrev}
              champion={champion}
              setChampionShards={setChampionShards}
            />
          )),
        )}
      </div>
      <div className="self-center text-sm">{`${plural('champion')(championsCount)} / ${
        champions.length
      }`}</div>
    </>
  )
}

const viewContainerClassName = (view: MasteriesQueryView): string => {
  switch (view) {
    case 'compact':
      return 'grid max-w-[104rem] grid-cols-[repeat(auto-fit,4rem)] items-start gap-4'
    case 'histogram':
      return 'grid max-w-7xl grid-cols-[auto_1fr] gap-y-2'
    case 'aram':
      return 'grid max-w-[104rem] grid-cols-[repeat(auto-fit,10px)] items-start gap-x-4 gap-y-1'
  }
}

const getSortBy = (
  sort: MasteriesQuerySort,
  order: MasteriesQueryOrder,
  view: MasteriesQueryView,
): List<Ord<EnrichedChampionMastery>> => {
  const aramSort =
    view === 'aram' ? EnrichedChampionMastery.Ord.byAramCategory : ord.fromCompare(() => 0)
  switch (sort) {
    case 'percents':
      return [
        aramSort,
        reverseIfDesc(EnrichedChampionMastery.Ord.byPercents),
        reverseIfDesc(ordByShardsWithLevel),
        reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
        EnrichedChampionMastery.Ord.byName,
      ]
    case 'points':
      return [
        aramSort,
        reverseIfDesc(EnrichedChampionMastery.Ord.byPoints),
        EnrichedChampionMastery.Ord.byName,
      ]
    case 'name':
      return [aramSort, reverseIfDesc(EnrichedChampionMastery.Ord.byName)]
  }

  function reverseIfDesc<A>(o: Ord<A>): Ord<A> {
    switch (order) {
      case 'asc':
        return o
      case 'desc':
        return ord.reverse(o)
    }
  }
}

const levelFilterPredicate =
  (levels: ReadonlySet<ChampionLevelOrZero>): Predicate<EnrichedChampionMastery> =>
  c =>
    readonlySet.elem(ChampionLevelOrZero.Eq)(c.championLevel, levels)

const positionFilterPredicate =
  (positions: ReadonlySet<ChampionPosition>) =>
  (c: EnrichedChampionMastery): boolean =>
    pipe(
      c.positions,
      List.some(position => readonlySet.elem(ChampionPosition.Eq)(position, positions)),
    )

// for histogram and aram views, hide if some search and champion doesn't match search
const histogramOrAramSearchFilterPredicate =
  (view: MasteriesQueryView, search: Maybe<string>): Predicate<EnrichedChampionMastery> =>
  c =>
    (view !== 'histogram' && view !== 'aram') || Maybe.isNone(search) || Maybe.isSome(c.glow)

// At level 7, shards doesn't matter
// At level 6, more than 1 shard doesn't matter
// At level 5 and less, more than 2 shards doesn't matter
const ordByShardsWithLevel: Ord<EnrichedChampionMastery> = pipe(
  EnrichedChampionMastery.Ord.byShards,
  ord.contramap(c =>
    pipe(
      EnrichedChampionMastery.Lens.shardsCount,
      optional.modify(shardsCount => {
        if (c.championLevel === 7) return Math.min(shardsCount, 0)
        if (c.championLevel === 6) return Math.min(shardsCount, 1)
        return Math.min(shardsCount, 2)
      }),
    )(c),
  ),
)

type ChampionProps = {
  maybeMaxPoints: Maybe<number>
  maybePrev: Maybe<EnrichedChampionMastery>
  champion: EnrichedChampionMastery
  setChampionShards: (champion: ChampionKey) => (count: number) => void
}

const Champion: React.FC<ChampionProps> = ({
  maybeMaxPoints,
  maybePrev,
  champion,
  setChampionShards,
}) => {
  const { masteriesQuery } = useHistory()

  const hoverRef = useRef<HTMLInputElement>(null)

  const isGlowing = Maybe.isSome(champion.glow)

  const isHistogram = masteriesQuery.view === 'histogram'
  const isAram = masteriesQuery.view === 'aram'

  return (
    <>
      {pipe(
        maybePrev,
        Maybe.filter(prev => ChampionCategory.Eq.equals(prev.category, champion.category)),
        Maybe.fold(
          () =>
            isAram ? (
              <h2
                className={cssClasses('col-span-full w-full pb-1 text-sm', [
                  'pt-4',
                  Maybe.isSome(maybePrev),
                ])}
              >
                {ChampionCategory.label[champion.category]}
              </h2>
            ) : null,
          () => null,
        ),
      )}
      <div
        ref={hoverRef}
        className={cssClasses(
          'relative',
          ['hidden', champion.isHidden],
          [champion.category !== 'balanced' ? 'col-span-5' : 'col-span-3', isAram],
        )}
      >
        {/* glow */}
        <div
          className={
            isGlowing
              ? 'absolute -left-1.5 -top-1.5 h-[76px] w-[76px] animate-glow rounded-1/2 bg-gradient-to-r from-amber-200 to-yellow-400 blur-sm'
              : 'hidden'
          }
          style={animationDelay(champion.glow)}
        />

        <div className="relative grid grid-cols-[auto_auto] rounded-xl bg-zinc-800 text-2xs">
          <ChampionMasterySquare
            {...champion}
            aram={masteriesQuery.view === 'aram' ? Maybe.some(champion.aram) : Maybe.none}
            setChampionShards={setChampionShards}
            roundedBrInsteadOfTr={isHistogram}
            hoverRef={hoverRef}
          />
          <ChampionMasteryAram aram={champion.aram} className={cssClasses(['hidden', !isAram])} />
        </div>
      </div>
      <ChampionMasteryHistogram
        maybeMaxPoints={maybeMaxPoints}
        champion={champion}
        className={cssClasses(['hidden', !isHistogram || champion.isHidden])}
      />
    </>
  )
}

const animationDelay: (glow: Maybe<number>) => React.CSSProperties | undefined = flow(
  Maybe.map((delay): React.CSSProperties => {
    const delaySeconds = `${round(delay, 3)}s`
    return {
      animationDelay: delaySeconds,
      MozAnimationDelay: delaySeconds,
      WebkitAnimationDelay: delaySeconds,
    }
  }),
  Maybe.toUndefined,
)

type ChampionMasteryHistogramProps = {
  maybeMaxPoints: Maybe<number>
  champion: EnrichedChampionMastery
  className?: string
}

const ChampionMasteryHistogram: React.FC<ChampionMasteryHistogramProps> = ({
  maybeMaxPoints,
  champion: {
    championLevel,
    championPoints,
    championPointsSinceLastLevel,
    championPointsUntilNextLevel,
  },
  className,
}) => {
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
        <div className="flex items-center">
          <span ref={placementRef} className="p-1.5 text-sm">
            {championPoints.toLocaleString()}
          </span>
        </div>
      </div>
      {pipe(
        pointsUntilAndSince,
        Maybe.fold(
          () => null,
          tooltip => (
            <Tooltip
              hoverRef={[placementRef, hoverRef1, hoverRef2, hoverRef3]}
              placement="bottom-start"
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

type ChampionMasteryAramProps = {
  aram: AramData
  className?: string
}

const ChampionMasteryAram: React.FC<ChampionMasteryAramProps> = ({ aram, className }) => {
  const renderChildrenCompact = useMemo(() => getRenderChildrenCompact(className), [className])
  return (
    <AramStatsCompact aram={aram} splitAt={Infinity}>
      {renderChildrenCompact}
    </AramStatsCompact>
  )
}

const getRenderChildrenCompact =
  (className: string | undefined) =>
  (children1: List<React.JSX.Element>): React.JSX.Element =>
    (
      <ul className={cssClasses('flex flex-col items-start self-center py-1 px-0.5', className)}>
        {children1}
      </ul>
    )
