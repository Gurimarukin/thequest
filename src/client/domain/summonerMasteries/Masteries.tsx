/* eslint-disable functional/no-expression-statements */
import { io, random } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { useMemo, useRef } from 'react'
import type { SWRResponse } from 'swr'

import type { ChallengesView } from '../../../shared/models/api/challenges/ChallengesView'
import { ChampionFactionOrNone } from '../../../shared/models/api/champion/ChampionFaction'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import type { Dict } from '../../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionCategoryTitle } from '../../components/ChampionCategoryTitle'
import { ChampionFactionTitle } from '../../components/ChampionFactionTitle'
import type { SetChampionShards } from '../../components/ChampionMasterySquare'
import { ChampionMasterySquare } from '../../components/ChampionMasterySquare'
import { MapChangesTooltip } from '../../components/mapChanges/MapChangesTooltip'
import { MapChangesStatsCompact } from '../../components/mapChanges/stats/MapChangesStatsCompact'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { CountWithTotal } from '../../models/CountWithTotal'
import { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { masteryBgGradient, masteryRulerColor } from '../../utils/colors'
import { cx } from '../../utils/cx'
import type { EnrichedChampionMastery } from './EnrichedChampionMastery'
import { MasteriesFilters } from './filters/MasteriesFilters'
import type { FactionsCount } from './getFilteredAndSortedMasteries'
import { getFilteredAndSortedMasteries } from './getFilteredAndSortedMasteries'

const { round } = NumberUtils

type Props = {
  challenges: SWRResponse<ChallengesView, unknown>
  masteries: List<EnrichedChampionMastery>
  setChampionShards: SetChampionShards
}

export const Masteries: React.FC<Props> = ({ challenges, masteries, setChampionShards }) => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()
  const { t } = useTranslation('common')
  const { champions } = useStaticData()

  const {
    filteredAndSortedMasteries,
    championsCount,
    factionsCount,
    searchCount,
    maybeMaxPoints,
    hideInsteadOfGlow,
    isHidden,
  } = useMemo(
    () => getFilteredAndSortedMasteries(t, challenges, masteries, masteriesQuery),
    [challenges, masteries, masteriesQuery, t],
  )

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
      <div className={cx('w-full', viewContainerClassName[masteriesQuery.view])}>
        {pipe(
          filteredAndSortedMasteries,
          ListUtils.mapWithPrevious((maybePrev, champion) => (
            <Champion
              key={`${champion.faction}${ChampionKey.unwrap(champion.championId)}`}
              challenges={challenges}
              factionsCount={factionsCount}
              maybeMaxPoints={maybeMaxPoints}
              isGlowing={!hideInsteadOfGlow && champion.glow}
              isHidden={isHidden(champion)}
              maybePrev={maybePrev}
              champion={champion}
              setChampionShards={setChampionShards}
            />
          )),
        )}
      </div>
      <div className="self-center text-sm">
        {t.nChampionsFraction(championsCount, champions.length)}
      </div>
    </>
  )
}

const viewContainerClassName: Dict<MasteriesQueryView, string> = {
  compact: 'grid max-w-[104rem] grid-cols-[repeat(auto-fit,4rem)] items-start gap-4',
  histogram: 'grid max-w-7xl grid-cols-[auto_1fr] gap-y-2',
  aram: 'grid grid-cols-[repeat(auto-fit,10px)] items-start gap-x-4 gap-y-1',
  factions: 'grid max-w-[104rem] grid-cols-[repeat(auto-fit,4rem)] items-start gap-4',
}

type ChampionProps = {
  challenges: SWRResponse<ChallengesView, unknown>
  factionsCount: FactionsCount
  maybeMaxPoints: Maybe<number>
  isGlowing: boolean
  isHidden: boolean
  maybePrev: Maybe<EnrichedChampionMastery>
  champion: EnrichedChampionMastery
  setChampionShards: SetChampionShards
}

const Champion: React.FC<ChampionProps> = ({
  challenges,
  factionsCount,
  maybeMaxPoints,
  isGlowing,
  isHidden,
  maybePrev,
  champion,
  setChampionShards,
}) => {
  const { masteriesQuery } = useHistory()

  const containerRef = useRef<HTMLDivElement>(null)

  const aramHoverRef1 = useRef<HTMLUListElement>(null)
  const renderChildrenCompact = useMemo(() => getRenderChildrenCompact(aramHoverRef1), [])
  const aramHoverRef2 = useRef<HTMLSpanElement>(null)

  const isHistogram = masteriesQuery.view === 'histogram'
  const isAram = masteriesQuery.view === 'aram'
  const isFactions = masteriesQuery.view === 'factions'

  return (
    <>
      {isAram &&
      !isHidden &&
      !pipe(
        maybePrev,
        Maybe.exists(prev =>
          MapChangesChampionCategory.Eq.equals(prev.category, champion.category),
        ),
      ) ? (
        <ChampionCategoryTitle
          category={champion.category}
          className={cx(['pt-4', Maybe.isSome(maybePrev)])}
        />
      ) : null}

      {isFactions &&
      !isHidden &&
      !pipe(
        maybePrev,
        Maybe.exists(prev => ChampionFactionOrNone.Eq.equals(prev.faction, champion.faction)),
      ) ? (
        <ChampionFactionTitle
          challenges={Maybe.some(challenges)}
          faction={champion.faction}
          count={factionsCount[champion.faction] ?? CountWithTotal.empty}
          className={cx(['pt-2', Maybe.isSome(maybePrev)])}
        />
      ) : null}

      <div
        ref={containerRef}
        className={cx(
          'relative',
          ['hidden', isHidden],
          [champion.category !== 'balanced' ? 'col-span-5' : 'col-span-3', isAram],
        )}
      >
        {/* glow */}
        <Glow isGlowing={isGlowing} />

        <div className="relative grid grid-cols-[auto_auto] grid-rows-[auto_1fr] rounded-xl bg-aram-stats">
          <ChampionMasterySquare
            {...champion}
            setChampionShards={setChampionShards}
            isHistogram={isHistogram}
            tooltipPlacementRef={containerRef}
            tooltipPlacement="top"
            centerLevel={false}
          />

          <div className={isAram ? 'contents' : 'hidden'}>
            <MapChangesStatsCompact data={champion.aram} splitAt={Infinity}>
              {renderChildrenCompact}
            </MapChangesStatsCompact>
          </div>
          {isAram ? (
            <>
              <Tooltip hoverRef={[aramHoverRef1, aramHoverRef2]} placementRef={containerRef}>
                <MapChangesTooltip data={champion.aram} />
              </Tooltip>

              <span ref={aramHoverRef2} className="rounded-bl-xl" />
            </>
          ) : null}
        </div>
      </div>
      <ChampionMasteryHistogram
        maybeMaxPoints={maybeMaxPoints}
        champion={champion}
        className={cx(['hidden', !isHistogram || isHidden])}
      />
    </>
  )
}

type GlowProps = {
  isGlowing: boolean
}

const Glow: React.FC<GlowProps> = ({ isGlowing }) => (
  <div
    className={
      isGlowing
        ? 'absolute left-[-7px] top-[-7px] grid size-[78px] place-items-center overflow-hidden rounded-1/2'
        : 'hidden'
    }
  >
    <div className="col-start-1 row-start-1 size-full animate-my-spin-reverse rounded-1/2 border-2 border-dashed border-white" />
    <div className="col-start-1 row-start-1 size-[calc(100%_-_4px)] animate-my-spin rounded-1/2 border-2 border-dashed border-goldenrod" />
  </div>
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
  const { t } = useTranslation()

  const hoverRef1 = useRef<HTMLDivElement>(null)
  const hoverRef2 = useRef<HTMLDivElement>(null)
  const hoverRef3 = useRef<HTMLDivElement>(null)
  const placementRef = useRef<HTMLSpanElement>(null)

  const pointsUntilAndSince = pipe(
    [
      2 <= championLevel
        ? Maybe.some(t.masteries.pointsSinceLastLevel(championPointsSinceLastLevel, championLevel))
        : Maybe.none,
      Maybe.some(t.masteries.pointsUntilNextLevel(championPointsUntilNextLevel, championLevel + 1)),
    ],
    List.compact,
    NonEmptyArray.fromReadonlyArray,
    Maybe.map(List.mkString(' — ')),
  )

  return (
    <>
      <div className={cx('flex flex-col', className)}>
        {pipe(
          maybeMaxPoints,
          Maybe.fold(
            () => null,
            maxPoints => {
              function p(n: number): `${number}%` {
                return `${round((100 * n) / maxPoints, 2)}%`
              }

              return (
                <div className="relative h-7">
                  <div
                    ref={hoverRef2}
                    className={cx('absolute left-0 top-0 h-full', masteryBgGradient(championLevel))}
                    style={{ width: p(championPoints) }}
                  />
                  {0 < championPointsUntilNextLevel ? (
                    <div
                      ref={hoverRef1}
                      className="absolute top-0 h-full bg-histogram-grey/50"
                      style={{
                        width: p(championPointsUntilNextLevel),
                        left: p(championPoints),
                      }}
                    />
                  ) : null}
                  {2 <= championLevel ? (
                    <div
                      ref={hoverRef3}
                      className={cx(
                        'absolute top-0 h-full border-l',
                        championPointsUntilNextLevel <= 0 ? 'border-x' : 'border-l',
                        masteryRulerColor(championLevel),
                      )}
                      style={{
                        width: p(championPointsSinceLastLevel + championPointsUntilNextLevel),
                        left: p(championPoints - championPointsSinceLastLevel),
                      }}
                    />
                  ) : null}
                </div>
              )
            },
          ),
        )}
        <div className="flex items-center">
          <span ref={placementRef} className="pl-1.5 pt-1 font-semibold">
            {t.common.number(championPoints)}
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

const getRenderChildrenCompact =
  (ref: React.RefObject<HTMLUListElement>) =>
  (children: List<React.ReactElement>): React.ReactElement => (
    <ul
      ref={ref}
      className="row-span-2 flex flex-col items-start justify-center rounded-r-xl px-0.5 py-1 text-2xs"
    >
      {children}
    </ul>
  )
