/* eslint-disable functional/no-return-void */
import type { Placement } from '@popperjs/core'
import { pipe } from 'fp-ts/function'
import { useCallback, useMemo, useRef } from 'react'

import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import { List, Maybe } from '../../shared/utils/fp'

import { Assets } from '../imgs/Assets'
import { AddOutline, RemoveOutline, SparklesSharp } from '../imgs/svgIcons'
import { cx } from '../utils/cx'
import { ChampionTooltip } from './ChampionTooltip'
import { CroppedChampionSquare } from './CroppedChampionSquare'
import { Tooltip } from './tooltip/Tooltip'

const { round } = NumberUtils

export type ChampionMasterySquareProps = {
  championId: ChampionKey
  chestGranted: boolean
  tokensEarned: number
  championLevel: ChampionLevelOrZero
  championPoints: number
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
  name: string
  percents: number
  shardsCount: Maybe<number>
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
  setChampionShards: ((champion: ChampionKey) => (count: number) => void) | null
  /**
   * @default false
   */
  isHistogram?: boolean
  tooltipHoverRef?: React.RefObject<HTMLDivElement>
  tooltipPlacementRef?: React.RefObject<Element>
  /**
   * @default 'top'
   */
  tooltipPlacement?: Placement
  /**
   * @default false
   */
  centerShards?: boolean
  /**
   * @default false
   */
  noShadow?: boolean
}

export const ChampionMasterySquare: React.FC<ChampionMasterySquareProps> = ({
  championId,
  championLevel,
  championPoints,
  championPointsSinceLastLevel,
  championPointsUntilNextLevel,
  chestGranted,
  tokensEarned,
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
  centerShards = false,
  noShadow = false,
}) => {
  const setShardsCount = useMemo(
    () => (setChampionShards !== null ? setChampionShards(championId) : null),
    [championId, setChampionShards],
  )

  const filteredShardsCount = pipe(
    shardsCount,
    Maybe.filter(count => (championLevel === 7 ? 0 < count : true)), // hide for level 7 and 0 shards
  )

  const hoverRef_ = useRef<HTMLDivElement>(null)
  const hoverRef = overrideHoverRef ?? hoverRef_

  return (
    <>
      <div ref={hoverRef_} className="relative flex h-16 w-16 items-center justify-center">
        {/* level border */}
        <div
          className={cx(
            'absolute inset-0 flex flex-col justify-end overflow-hidden rounded-bl-xl bg-black',
            isHistogram ? 'rounded-br-xl' : 'rounded-tr-xl',
            ['shadow-even shadow-black', !noShadow],
          )}
        >
          <LevelSVG
            championLevel={championLevel}
            championPointsUntilNextLevel={isHistogram ? 0 : championPointsUntilNextLevel} // always full for histogram
            championPointsSinceLastLevel={championPointsSinceLastLevel}
          />
        </div>

        {/* champion image */}
        <CroppedChampionSquare
          championKey={championId}
          championName={name}
          className={cx(
            'relative h-[54px] w-[54px] rounded-bl-lg',
            isHistogram ? 'rounded-br-lg' : 'rounded-tr-lg',
          )}
        />

        {/* champion level top left */}
        <div
          className={cx(
            'absolute left-0 top-0 flex h-4 w-3.5 justify-center overflow-hidden rounded-br-lg bg-black pr-0.5 text-xs font-bold',
            championLevelNumberColor(championLevel),
          )}
        >
          <span className="-mt-0.5">{championLevel}</span>
        </div>

        {/* tokens next to champion level */}
        <Tokens championLevel={championLevel} tokensEarned={tokensEarned} />

        {/* chest bottom left */}
        {chestGranted ? (
          <div className="absolute bottom-0 left-0 flex h-[15px] w-[18px] flex-col-reverse rounded-tr bg-black">
            <img src={Assets.chest} alt="Icône de coffre" className="w-4" />
          </div>
        ) : null}

        {/* shards bottom right */}
        {pipe(
          filteredShardsCount,
          Maybe.fold(
            () => null,
            shards => (
              <Shards
                shardsCount={shards}
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
        className="!p-0"
      >
        <ChampionTooltip
          chestGranted={chestGranted}
          tokensEarned={tokensEarned}
          championLevel={championLevel}
          championPoints={championPoints}
          championPointsUntilNextLevel={championPointsUntilNextLevel}
          name={name}
          percents={percents}
          filteredShardsCount={filteredShardsCount}
          positions={positions}
          factions={factions}
        />
      </Tooltip>
    </>
  )
}

type LevelSVGProps = {
  championLevel: ChampionLevelOrZero
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
    className={cx('h-full w-full', championLevelBgColor(championLevel))}
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
        0.95 *
          levelPercents({
            championPointsSinceLastLevel,
            championPointsUntilNextLevel,
          })
      }
      className="origin-center rotate-[-127deg]"
    />
  </svg>
)

type ChampionLevelPercents = {
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
}

const levelPercents = ({
  championPointsSinceLastLevel,
  championPointsUntilNextLevel,
}: ChampionLevelPercents): number => {
  const levelRange = championPointsSinceLastLevel + championPointsUntilNextLevel
  if (levelRange === 0) return 0
  return round((100 * championPointsSinceLastLevel) / levelRange)
}

const championLevelBgColor = (championLevel: ChampionLevelOrZero): string | undefined => {
  if (championLevel === 7) return 'text-mastery-7'
  if (championLevel === 6) return 'text-mastery-6'
  if (championLevel === 5) return 'text-mastery-5'
  if (championLevel === 4) return 'text-mastery-4'
  if (championLevel === 0) return undefined
  return 'text-mastery-3'
}

const championLevelNumberColor = (championLevel: ChampionLevelOrZero): string => {
  if (championLevel === 7) return 'text-mastery-7-text'
  if (championLevel === 6) return 'text-mastery-6-text'
  if (championLevel === 5) return 'text-mastery-5-text'
  if (championLevel === 4) return 'text-mastery-4-text'
  return 'text-mastery-3-text'
}

type TokensProps = {
  championLevel: number
  tokensEarned: number
}

const Tokens: React.FC<TokensProps> = ({ championLevel, tokensEarned }) => {
  const render = useCallback(
    (totalTockens: number, src: string): React.ReactElement => {
      const alt = `Jeton de maîtrise ${championLevel + 1}`
      return (
        <span
          className={cx(
            'absolute left-[13px] top-0 flex h-2.5 rounded-br bg-black pl-0.5',
            ['gap-0.5 pb-0.5 pr-0.5 pt-px', championLevel === 5],
            ['gap-[3px] pb-px pr-[3px]', championLevel === 6],
          )}
        >
          {pipe(
            repeatElements(tokensEarned, i => (
              <img key={i} src={src} alt={alt} className="h-full bg-cover" />
            )),
            List.concat(
              repeatElements(totalTockens - tokensEarned, i => (
                <img
                  key={totalTockens - i}
                  src={src}
                  alt={`${alt} (non obtenu)`}
                  className="h-full bg-cover grayscale"
                />
              )),
            ),
          )}
        </span>
      )
    },
    [championLevel, tokensEarned],
  )

  if (championLevel === 5) return render(2, Assets.tokens[5])
  if (championLevel === 6) return render(3, Assets.tokens[6])
  return null
}

function repeatElements<A>(n: number, getA: (i: number) => A): List<A> {
  return pipe([...Array(Math.max(n, 0))], List.mapWithIndex(getA))
}

type ShardsProps = {
  shardsCount: number
  setShardsCount: ((count: number) => void) | null
  centerShards: boolean
}

const Shards: React.FC<ShardsProps> = ({ shardsCount, setShardsCount, centerShards = false }) => {
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

  return (
    <div className="group absolute bottom-0 right-0 flex items-end">
      <span className="-mr-0.5 overflow-hidden rounded-tl bg-black pl-px pt-px">
        <SparklesSharp className="h-2.5 w-2.5 rotate-180" />
      </span>
      <span
        className={cx(
          'flex h-4 w-3.5 rounded-tl-lg bg-black pl-0.5 text-xs',
          centerShards ? 'justify-center' : 'justify-end group-hover:justify-center',
        )}
      >
        <span className="mt-0.5">{shardsCount}</span>
      </span>
      {setShardsCount !== null ? (
        <div
          className={cx(
            'absolute -right-px z-10 hidden flex-col items-end overflow-hidden rounded-[5px] group-hover:flex',
            ['-bottom-3.5', canRemoveShard],
          )}
        >
          <span className={cx('flex bg-black p-px pb-0.5', ['hidden', 9 <= shardsCount])}>
            <button
              ref={addButtonRef}
              type="button"
              onClick={addShardCount}
              className="w-3 rounded-t bg-goldenrod text-black"
            >
              <AddOutline className="w-full" />
            </button>
            <Tooltip hoverRef={addButtonRef} placement="right" className="z-10 !text-2xs">
              Ajouter un fragment
            </Tooltip>
          </span>
          <span className="h-3 w-px bg-black" />
          <span className={cx('flex bg-black p-px', ['hidden', !canRemoveShard])}>
            <button
              ref={removeButtonRef}
              type="button"
              onClick={removeShardCount}
              className="w-3 rounded-b bg-goldenrod text-black"
            >
              <RemoveOutline className="w-full" />
            </button>
            <Tooltip hoverRef={removeButtonRef} placement="right" className="z-10 !text-2xs">
              Enlever un fragment
            </Tooltip>
          </span>
        </div>
      ) : null}
    </div>
  )
}
