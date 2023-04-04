/* eslint-disable functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import React, { useCallback, useMemo } from 'react'

import type { ChampionKey } from '../../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { Tooltip } from '../../components/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { Assets } from '../../imgs/Assets'
import { AddOutline, RemoveOutline, SparklesSharp } from '../../imgs/svgIcons'
import { NumberUtils } from '../../utils/NumberUtils'
import { cssClasses } from '../../utils/cssClasses'

const { round } = NumberUtils
const { plural } = StringUtils

type ChampionMasterySquareProps = {
  championId: ChampionKey
  // eslint-disable-next-line react/boolean-prop-naming
  chestGranted: boolean
  tokensEarned: number
  championLevel: ChampionLevelOrZero
  championPoints: number
  championPointsUntilNextLevel: number
  name: string
  percents: number
  shardsCount: Maybe<number>
  glow: Maybe<number>
  setChampionShards: ((champion: ChampionKey) => (count: number) => void) | null
  /**
   * @default false
   */
  isHistogram?: boolean
}

export const ChampionMasterySquare = ({
  championId,
  championLevel,
  championPoints,
  championPointsUntilNextLevel,
  chestGranted,
  tokensEarned,
  name,
  percents,
  shardsCount,
  glow,
  setChampionShards,
  isHistogram = false,
}: ChampionMasterySquareProps): JSX.Element => {
  const staticData = useStaticData()

  const setShardsCount = useMemo(
    () => (setChampionShards !== null ? setChampionShards(championId) : null),
    [championId, setChampionShards],
  )

  const isGlowing = Maybe.isSome(glow)

  const filteredShardsCount = pipe(
    shardsCount,
    Maybe.filter(count => (championLevel === 7 ? 0 < count : true)), // hide for level 7 and 0 shards
  )

  const tokenShards = pipe(
    [
      championLevel === 5 || championLevel === 6
        ? Maybe.some(<span>{plural('jeton')(tokensEarned)}</span>)
        : Maybe.none,
      pipe(
        filteredShardsCount,
        // eslint-disable-next-line react/jsx-key
        Maybe.map(shards => <span>{plural('fragment')(shards)}</span>),
      ),
    ],
    List.compact,
    NonEmptyArray.fromReadonlyArray,
  )

  const percentsElement = (
    <span className="relative flex items-center py-0.5 pr-1 shadow-black text-shadow">
      {Math.round(percents)} %
    </span>
  )

  return (
    <div className="relative">
      <div
        className={cssClasses(
          ['hidden', !isGlowing],
          [
            'absolute left-[-6px] top-[-6px] h-[76px] w-[76px] animate-glow rounded-1/2 bg-gradient-to-r from-amber-200 to-yellow-400 blur-sm',
            isGlowing,
          ],
        )}
        style={animationDelay(glow)}
      />
      <div
        className={cssClasses(
          'relative flex h-16 w-16 items-center justify-center rounded-bl-xl',
          ['rounded-br-xl', isHistogram],
          ['rounded-tr-xl', !isHistogram],
          ['bg-mastery7-blue', championLevel === 7],
          ['bg-mastery6-violet', championLevel === 6],
          ['bg-mastery5-red', championLevel === 5],
          ['bg-mastery4-brown', championLevel === 4],
          ['bg-mastery-beige', championLevel < 4],
        )}
      >
        <div
          className={cssClasses(
            'h-12 w-12 overflow-hidden rounded-bl-lg',
            ['rounded-br-lg', isHistogram],
            ['rounded-tr-lg', !isHistogram],
          )}
        >
          <img
            src={staticData.assets.champion.square(championId)}
            alt={`Icône de ${name}`}
            className="m-[-3px] w-[calc(100%_+_6px)] max-w-none"
          />
        </div>
        <div
          className={cssClasses(
            'absolute top-0 left-0 flex h-4 w-[14px] justify-center overflow-hidden rounded-br-lg bg-black pr-0.5 text-xs font-bold',
            ['text-blue-500', championLevel === 7],
            ['text-purple-400', championLevel === 6],
            ['text-red-700', championLevel === 5],
            ['text-yellow-600', championLevel === 4],
            ['text-neutral-400', championLevel < 4],
          )}
        >
          <span className="mt-[-2px]">{championLevel}</span>
        </div>
        <Tokens championLevel={championLevel} tokensEarned={tokensEarned} />
        {chestGranted ? (
          <div className="absolute left-0 bottom-0 flex h-[15px] w-[18px] flex-col-reverse rounded-tr bg-black">
            <img src={Assets.chest} alt="Icône de coffre" className="w-4" />
          </div>
        ) : null}
        <Tooltip
          tooltip={
            <>
              <div className="relative flex overflow-hidden">
                <span
                  className={cssClasses(
                    'grow py-0.5 pr-4 pl-2 text-center font-bold shadow-black text-shadow',
                    bgGradientMastery(championLevel),
                  )}
                >
                  {name}
                </span>
                {/* hitbox */}
                {percentsElement}
                <div className="absolute right-0">
                  <span className="absolute -left-2 -top-2 h-[200%] w-[200%] rotate-12 bg-goldenrod-secondary shadow-inner shadow-black" />
                  {percentsElement}
                </div>
              </div>
              <p className="border-b border-mastery4-brown-secondary px-2 py-1 text-center text-2xs">
                {`${championPoints.toLocaleString()}${
                  0 < championLevel && championLevel < 5
                    ? ` / ${(championPoints + championPointsUntilNextLevel).toLocaleString()}`
                    : ''
                }  pts`}
              </p>
              <div className="flex flex-col items-center gap-1 py-1 px-2 text-2xs">
                {pipe(
                  tokenShards,
                  Maybe.fold(
                    () => null,
                    nea => <div className="flex items-center gap-2">{nea}</div>,
                  ),
                )}
                <div className="flex items-center gap-2">
                  <span>{chestGranted ? 'coffre obtenu' : 'coffre disponible'}</span>
                </div>
              </div>
            </>
          }
          tooltipContainerClassName="top-full"
          tooltipClassName="pt-0 pr-0 pb-0 pl-0 flex flex-col"
          className="!absolute top-0 left-0 h-full w-full"
        >
          <div className="absolute h-full w-full" />
        </Tooltip>
        {pipe(
          filteredShardsCount,
          Maybe.fold(
            () => null,
            shards => <Shards name={name} shardsCount={shards} setShardsCount={setShardsCount} />,
          ),
        )}
      </div>
    </div>
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

export const bgGradientMastery = (level: ChampionLevelOrZero): string => {
  if (level === 7) return 'bg-gradient-to-r from-mastery7-blue to-mastery7-blue-secondary'
  if (level === 6) return 'bg-gradient-to-r from-mastery6-violet to-mastery6-violet-secondary'
  if (level === 5) return 'bg-gradient-to-r from-mastery5-red to-mastery5-red-secondary'
  if (level === 4) return 'bg-gradient-to-r from-mastery4-brown to-mastery4-brown-secondary'
  return 'bg-mastery-beige'
}

type TokensProps = {
  championLevel: number
  tokensEarned: number
}

const Tokens = ({ championLevel, tokensEarned }: TokensProps): JSX.Element | null => {
  const render = useCallback(
    (totalTockens: number, src: string): JSX.Element => {
      const alt = `Jeton de maîtrise ${championLevel + 1}`
      return (
        <span
          className={cssClasses(
            'absolute left-[13px] top-0 flex h-[10px] rounded-br bg-black pl-0.5',
            ['gap-0.5 pt-[1px] pb-0.5 pr-0.5', championLevel === 5],
            ['gap-[3px] pb-[1px] pr-[3px]', championLevel === 6],
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

  if (championLevel === 5) return render(2, Assets.token5)
  if (championLevel === 6) return render(3, Assets.token6)
  return null
}

function repeatElements<A>(n: number, getA: (i: number) => A): List<A> {
  return pipe([...Array(Math.max(n, 0))], List.mapWithIndex(getA))
}

type ShardsProps = {
  name: string
  shardsCount: number
  setShardsCount: ((count: number) => void) | null
}

const Shards = ({ name, shardsCount, setShardsCount }: ShardsProps): JSX.Element => {
  const addShardCount = useCallback(
    () => setShardsCount?.(shardsCount + 1),
    [setShardsCount, shardsCount],
  )
  const removeShardCount = useCallback(
    () => setShardsCount?.(shardsCount - 1),
    [setShardsCount, shardsCount],
  )
  return (
    <div title={`${name} — fragments`} className="group absolute right-0 bottom-0 flex items-end">
      <span className="mr-[-2px] overflow-hidden rounded-tl bg-black pl-[1px] pt-[1px]">
        <SparklesSharp className="h-[10px] w-[10px] rotate-180 fill-current" />
      </span>
      <span className="flex h-4 w-[14px] justify-center rounded-tl-lg bg-black pl-0.5 text-xs">
        <span className="mt-0.5">{shardsCount}</span>
      </span>
      <div className="absolute bottom-[calc(-100%_+_3px)] right-0 z-10 hidden h-[41px] w-[14px] flex-col justify-between overflow-hidden rounded-tl-[6px] group-hover:flex">
        <span
          className={cssClasses('flex bg-black pl-0.5 pt-0.5 pb-[3px]', [
            'invisible',
            setShardsCount === null || 9 <= shardsCount,
          ])}
        >
          <button
            type="button"
            onClick={addShardCount}
            title={`${name} — ajouter un fragment`}
            className="rounded-t bg-goldenrod text-black"
          >
            <AddOutline className="w-full" />
          </button>
        </span>
        <span
          className={cssClasses('flex bg-black pl-0.5', [
            'invisible',
            setShardsCount === null || shardsCount <= 0,
          ])}
        >
          <button
            type="button"
            onClick={removeShardCount}
            title={`${name} — enlever un fragment`}
            className="rounded-b bg-goldenrod text-black"
          >
            <RemoveOutline className="w-full" />
          </button>
        </span>
      </div>
    </div>
  )
}
