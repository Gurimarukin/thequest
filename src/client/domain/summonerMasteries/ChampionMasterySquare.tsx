/* eslint-disable functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import React, { useCallback, useMemo } from 'react'

import type { ChampionKey } from '../../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { useStaticData } from '../../contexts/StaticDataContext'
import { Assets } from '../../imgs/Assets'
import { AddOutline, RemoveOutline, SparklesSharp } from '../../imgs/svgIcons'
import { NumberUtils } from '../../utils/NumberUtils'
import { cssClasses } from '../../utils/cssClasses'

const { round } = NumberUtils
const { plural } = StringUtils

type ChampionMasterySquareProps = {
  readonly championId: ChampionKey
  // eslint-disable-next-line react/boolean-prop-naming
  readonly chestGranted: boolean
  readonly tokensEarned: number
  readonly championLevel: ChampionLevelOrZero
  readonly name: string
  readonly percents: number
  readonly shardsCount: Maybe<number>
  readonly glow: Maybe<number>
  readonly setChampionShards: ((champion: ChampionKey) => (count: number) => void) | null
}

export const ChampionMasterySquare = ({
  championId,
  championLevel,
  chestGranted,
  tokensEarned,
  name,
  percents,
  shardsCount,
  glow,
  setChampionShards,
}: ChampionMasterySquareProps): JSX.Element => {
  const staticData = useStaticData()

  const setShardsCount = useMemo(
    () => (setChampionShards !== null ? setChampionShards(championId) : null),
    [championId, setChampionShards],
  )

  const nameLevelTokens = `${name} — niveau ${championLevel}${
    championLevel === 5 || championLevel === 6 ? ` — ${plural(tokensEarned, 'jeton')}` : ''
  }\n${Math.round(percents)}%`

  const isGlowing = Maybe.isSome(glow)

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
          'relative flex h-16 w-16 items-center justify-center',
          ['bg-mastery7-blue', championLevel === 7],
          ['bg-mastery6-violet', championLevel === 6],
          ['bg-mastery5-red', championLevel === 5],
          ['bg-mastery4-brown', championLevel === 4],
          ['bg-mastery-beige', championLevel < 4],
        )}
        title={name}
      >
        <div className="h-12 w-12 overflow-hidden">
          <img
            src={staticData.assets.champion.square(championId)}
            alt={`Icône de ${name}`}
            className="m-[-3px] w-[calc(100%_+_6px)] max-w-none"
          />
        </div>
        <div
          className={cssClasses(
            'absolute top-0 left-0 flex h-4 w-[14px] justify-center overflow-hidden rounded-br-lg bg-black pr-[2px] text-xs font-bold',
            ['text-blue-500', championLevel === 7],
            ['text-purple-400', championLevel === 6],
            ['text-red-700', championLevel === 5],
            ['text-yellow-600', championLevel === 4],
          )}
          title={nameLevelTokens}
        >
          <span className="mt-[-2px]">{championLevel}</span>
        </div>
        <Tokens championLevel={championLevel} tokensEarned={tokensEarned} title={nameLevelTokens} />
        {chestGranted ? (
          <div
            title={`${name} — coffre obtenu`}
            className="absolute left-0 bottom-0 flex h-[15px] w-[18px] flex-col-reverse rounded-tr bg-black"
          >
            <img src={Assets.chest} alt="Icône de coffre" className="w-4" />
          </div>
        ) : null}
        {pipe(
          shardsCount,
          Maybe.filter(count => (championLevel === 7 ? 0 < count : true)), // hide for level 7 and 0 shards
          Maybe.fold(
            () => null,
            count => <Shards name={name} shardsCount={count} setShardsCount={setShardsCount} />,
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

type TokensProps = {
  readonly championLevel: number
  readonly tokensEarned: number
  readonly title?: string
}

const Tokens = ({ championLevel, tokensEarned, title }: TokensProps): JSX.Element | null => {
  const render = useCallback(
    (totalTockens: number, src: string): JSX.Element => {
      const alt = `Jeton de maîtrise ${championLevel + 1}`
      return (
        <span
          title={title}
          className={cssClasses(
            'absolute left-[13px] top-0 flex h-[10px] rounded-br bg-black pl-[2px]',
            ['gap-[2px] pt-[1px] pb-[2px] pr-[2px]', championLevel === 5],
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
    [championLevel, title, tokensEarned],
  )

  if (championLevel === 5) return render(2, Assets.token5)
  if (championLevel === 6) return render(3, Assets.token6)
  return null
}

function repeatElements<A>(n: number, getA: (i: number) => A): List<A> {
  return pipe([...Array(Math.max(n, 0))], List.mapWithIndex(getA))
}

type ShardsProps = {
  readonly name: string
  readonly shardsCount: number
  readonly setShardsCount: ((count: number) => void) | null
}

const Shards = ({ name, shardsCount, setShardsCount }: Readonly<ShardsProps>): JSX.Element => {
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
      <span className="flex h-4 w-[14px] justify-center rounded-tl-lg bg-black pl-[2px] text-xs">
        <span className="mt-[2px]">{shardsCount}</span>
      </span>
      <div className="absolute bottom-[calc(-100%_+_3px)] right-[-1px] z-10 hidden h-[39px] w-[14px] flex-col justify-between overflow-hidden rounded-b-[6px] rounded-tl-[6px] group-hover:flex">
        <span
          className={cssClasses('mr-[1px] flex bg-black pr-[1px] pl-[2px] pt-[2px]', [
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
        {setShardsCount !== null && 0 < shardsCount ? (
          <span className="flex bg-black p-[2px]">
            <button
              type="button"
              onClick={removeShardCount}
              title={`${name} — enlever un fragment`}
              className="rounded-b bg-goldenrod text-black"
            >
              <RemoveOutline className="w-full" />
            </button>
          </span>
        ) : null}
      </div>
    </div>
  )
}
