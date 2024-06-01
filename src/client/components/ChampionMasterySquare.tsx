/* eslint-disable functional/no-return-void */
import type { Placement } from '@popperjs/core'
import { pipe } from 'fp-ts/function'
import { useCallback, useMemo, useRef } from 'react'

import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { AddOutline, RemoveOutline, SparkSolid, SparklesSharp } from '../imgs/svgs/icons'
import { masteryBgColor, masteryTextColor } from '../utils/colors'
import { cx } from '../utils/cx'
import { ChampionTooltip } from './ChampionTooltip'
import { CroppedChampionSquare } from './CroppedChampionSquare'
import { Loading } from './Loading'
import { Tooltip } from './tooltip/Tooltip'

const { round } = NumberUtils

export type ChampionMasterySquareProps = {
  championId: ChampionKey
  tokensEarned: number
  markRequiredForNextLevel: number
  championLevel: number
  championPoints: number
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
  name: string
  percents: number
  shardsCount: Maybe<number>
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
  setChampionShards: SetChampionShards | null
  /**
   * @default false
   */
  isHistogram?: boolean
  tooltipHoverRef?: React.RefObject<Element> | NonEmptyArray<React.RefObject<Element>>
  tooltipPlacementRef?: React.RefObject<Element>
  /**
   * @default 'top'
   */
  tooltipPlacement?: Placement
  tooltipShouldHide?: boolean
  /**
   * @default true
   */
  centerLevel?: boolean
  /**
   * @default false
   */
  centerShards?: boolean
  /**
   * @default false
   */
  noShadow?: boolean
  draggable?: boolean
}

export type SetChampionShards = {
  isLoading: boolean
  run: (champion: ChampionKey) => (count: number) => void
}

export const ChampionMasterySquare: React.FC<ChampionMasterySquareProps> = ({
  championId,
  championLevel,
  championPoints,
  championPointsSinceLastLevel,
  championPointsUntilNextLevel,
  tokensEarned,
  markRequiredForNextLevel,
  name,
  percents,
  shardsCount,
  positions,
  factions,
  setChampionShards,
  isHistogram = false,
  tooltipHoverRef: overrideHoverRef,
  tooltipPlacementRef,
  tooltipPlacement = 'bottom',
  tooltipShouldHide,
  centerLevel = true,
  centerShards = false,
  noShadow = false,
  draggable,
}) => {
  const { t } = useTranslation('common')

  const setShardsCount = useMemo(
    () => (setChampionShards !== null ? setChampionShards.run(championId) : null),
    [championId, setChampionShards],
  )

  const hoverRef_ = useRef<HTMLDivElement>(null)
  const hoverRef = overrideHoverRef ?? hoverRef_

  const tokens = pipe(
    repeatElements(tokensEarned, i => (
      <SparkSolid key={i} className={`-mt-px h-2.5 ${masteryTextColor(championLevel)}`} />
    )),
    List.concat(
      repeatElements(markRequiredForNextLevel - tokensEarned, i => (
        <span
          key={tokensEarned + i}
          className="m-0.5 mt-px size-1.5 rounded-1/2 border border-grey-500"
        />
      )),
    ),
    NonEmptyArray.fromReadonlyArray,
  )

  return (
    <>
      <div ref={hoverRef_} className="grid size-16">
        {/* level border */}
        <div
          className={cx(
            'h-full w-full overflow-hidden rounded-bl-xl bg-black area-1',
            isHistogram ? 'rounded-br-xl' : 'rounded-tr-xl',
            ['shadow-even shadow-black', !noShadow],
          )}
        >
          {0 < championLevel ? (
            <LevelSVG
              championLevel={championLevel}
              {...(isHistogram
                ? // always full for histogram
                  { championPointsUntilNextLevel: 0, championPointsSinceLastLevel: 1 }
                : { championPointsUntilNextLevel, championPointsSinceLastLevel })}
            />
          ) : null}
        </div>

        {/* champion image */}
        <CroppedChampionSquare
          championKey={championId}
          championName={name}
          isDraggable={draggable}
          className={cx(
            'h-[54px] w-[54px] self-center justify-self-center rounded-bl-lg bg-black text-2xs text-transparent area-1',
            isHistogram ? 'rounded-br-lg' : 'rounded-tr-lg',
          )}
        />

        {/* top left */}
        <div className="flex items-start self-start justify-self-start area-1">
          {/* champion level */}
          <div
            className={cx(
              'flex overflow-hidden bg-black pb-[3px] pr-[5px] text-sm font-bold leading-2.5',
              Maybe.isNone(tokens) ? 'rounded-br-lg' : 'rounded-br',
              ['pl-0.5 pt-0.5', centerLevel],
              masteryTextColor(championLevel),
            )}
          >
            <span>{t.number(championLevel)}</span>
          </div>

          {/* tokens next to champion level */}
          {pipe(
            tokens,
            Maybe.fold(
              () => null,
              elements => (
                <div className="-ml-0.5 flex gap-0.5 rounded-br bg-black pb-0.5 pr-0.5">
                  {elements}
                </div>
              ),
            ),
          )}
        </div>

        {/* shards bottom right */}
        {pipe(
          shardsCount,
          Maybe.filter(n => 0 < n),
          Maybe.fold(
            () => null,
            shards => (
              <Shards
                shardsCount={shards}
                isLoading={setChampionShards?.isLoading === true}
                setShardsCount={setShardsCount}
                centerShards={centerShards}
              />
            ),
          ),
        )}
      </div>

      <Tooltip
        hoverRef={hoverRef}
        placementRef={tooltipPlacementRef}
        placement={tooltipPlacement}
        shouldHide={tooltipShouldHide}
        className="!p-0"
      >
        <ChampionTooltip
          tokensEarned={tokensEarned}
          markRequiredForNextLevel={markRequiredForNextLevel}
          championLevel={championLevel}
          championPoints={championPoints}
          championPointsUntilNextLevel={championPointsUntilNextLevel}
          name={name}
          percents={percents}
          shardsCount={shardsCount}
          positions={positions}
          factions={factions}
        />
      </Tooltip>
    </>
  )
}

type LevelSVGProps = {
  championLevel: number
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
}

const totalLength = 100.5

const LevelSVG: React.FC<LevelSVGProps> = ({
  championLevel,
  championPointsSinceLastLevel,
  championPointsUntilNextLevel,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={cx('h-full w-full', masteryBgColor(championLevel))}
  >
    <circle
      cx="16"
      cy="16"
      r="16"
      stroke="currentColor"
      strokeWidth="16"
      strokeDasharray={totalLength}
      strokeDashoffset={
        totalLength -
        0.96 *
          levelPercents({
            championPointsSinceLastLevel,
            championPointsUntilNextLevel,
          })
      }
      className="origin-center rotate-[-128.5deg]"
    />
  </svg>
)

type ChampionLevelPercents = {
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
}

function levelPercents({
  championPointsSinceLastLevel,
  championPointsUntilNextLevel,
}: ChampionLevelPercents): number {
  // championPointsSinceLastLevel can be negative because of new system
  // see server/services/MasteriesService#fixPointsSinceLastLevel
  if (championPointsSinceLastLevel < 0) return 0

  const levelRange = championPointsSinceLastLevel + championPointsUntilNextLevel

  if (levelRange === 0) return 0

  return Math.min(round((100 * championPointsSinceLastLevel) / levelRange), 100)
}

function repeatElements<A>(n: number, getA: (i: number) => A): List<A> {
  return pipe(Array.from({ length: Math.max(n, 0) }), List.mapWithIndex(getA))
}

type ShardsProps = {
  shardsCount: number
  isLoading: boolean
  setShardsCount: ((count: number) => void) | null
  centerShards: boolean
}

const Shards: React.FC<ShardsProps> = ({
  shardsCount,
  isLoading,
  setShardsCount,
  centerShards = false,
}) => {
  const { t } = useTranslation('masteries')

  const addButtonRef = useRef<HTMLButtonElement>(null)
  const removeButtonRef = useRef<HTMLButtonElement>(null)

  const addShardCount = useCallback(
    () => setShardsCount?.(shardsCount + 1),
    [setShardsCount, shardsCount],
  )
  const removeShardCount = useCallback(
    () => setShardsCount?.(shardsCount - 1),
    [setShardsCount, shardsCount],
  )

  const canRemoveShard = 1 <= shardsCount
  const canAddShard = shardsCount < 9

  return (
    <div className="group relative flex h-2.5 flex-row-reverse items-end self-end justify-self-end area-1">
      {setShardsCount !== null ? (
        <div
          className={cx(
            'absolute -right-px z-10 hidden flex-col justify-center overflow-hidden bg-black p-px group-hover:flex',
            ['gap-4', canAddShard === canRemoveShard],
            canAddShard ? '-top-4 rounded-t-[5px]' : '-bottom-4 rounded-tl-[5px]',
            ['rounded-b-[5px]', canRemoveShard],
          )}
        >
          <span className={cx('flex', ['mb-3', !canRemoveShard], ['hidden', !canAddShard])}>
            {isLoading ? (
              <Loading className="w-3 text-goldenrod-bis" />
            ) : (
              <>
                <button
                  ref={addButtonRef}
                  type="button"
                  onClick={addShardCount}
                  className="w-3 rounded-t bg-goldenrod text-black"
                >
                  <AddOutline className="w-full" />
                </button>
                <Tooltip hoverRef={addButtonRef} placement="right" className="z-10 !text-xs">
                  {t.addShard}
                </Tooltip>
              </>
            )}
          </span>
          <span className={cx('flex', ['mt-[15px]', !canAddShard], ['hidden', !canRemoveShard])}>
            {isLoading ? (
              <Loading className="w-3 text-goldenrod-bis" />
            ) : (
              <>
                <button
                  ref={removeButtonRef}
                  type="button"
                  onClick={removeShardCount}
                  className="w-3 rounded-b bg-goldenrod text-black"
                >
                  <RemoveOutline className="w-full" />
                </button>
                <Tooltip hoverRef={removeButtonRef} placement="right" className="z-10 !text-xs">
                  {t.removeShard}
                </Tooltip>
              </>
            )}
          </span>
        </div>
      ) : null}
      <div
        className={cx(
          'relative z-10 flex items-center justify-center overflow-hidden rounded-tl-lg bg-black pt-1 font-semibold',
          centerShards
            ? 'w-4 pl-1'
            : cx('pl-1.5 group-hover:w-4 group-hover:pl-1', ['group-hover:pt-0.5', canAddShard]),
        )}
      >
        <span className="text-[15px] leading-[9px]">{shardsCount}</span>
      </div>
      <span className="relative z-10 mr-[-3px] rounded-tl bg-black pl-px pt-px">
        <SparklesSharp className="size-2.5 rotate-180" />
      </span>
    </div>
  )
}
