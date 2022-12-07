import { flow, pipe } from 'fp-ts/function'
import React, { useCallback } from 'react'

import { List, Maybe } from '../../../shared/utils/fp'

import { useStaticData } from '../../contexts/StaticDataContext'
import { Assets } from '../../imgs/Assets'
import { NumberUtils } from '../../utils/NumberUtils'
import { cssClasses } from '../../utils/cssClasses'
import type { EnrichedChampionMastery } from './EnrichedChampionMastery'

const { round } = NumberUtils

type ChampionMasterySquareProps = {
  readonly champion: EnrichedChampionMastery
}

export const ChampionMasterySquare = ({
  champion: { championId, championLevel, chestGranted, tokensEarned, name, percents, glow },
}: ChampionMasterySquareProps): JSX.Element => {
  const staticData = useStaticData()

  const nameLevelTokens = `${name} - niveau ${championLevel}${
    championLevel === 5 || championLevel === 6
      ? ` - ${tokensEarned} jeton${tokensEarned < 2 ? '' : 's'}`
      : ''
  }\n${Math.round(percents)}%`

  const isGlowing = Maybe.isSome(glow)

  return (
    <div className="relative">
      <div
        className={cssClasses(
          ['hidden', !isGlowing],
          [
            'w-[76px] h-[76px] absolute left-[-6px] top-[-6px] rounded-1/2 bg-gradient-to-r from-amber-200 to-yellow-400 blur-sm animate-glow',
            isGlowing,
          ],
        )}
        style={animationDelay(glow)}
      />
      <div
        className={cssClasses(
          'w-16 h-16 relative flex items-center justify-center',
          ['bg-mastery7-blue', championLevel === 7],
          ['bg-mastery6-violet', championLevel === 6],
          ['bg-mastery5-red', championLevel === 5],
          ['bg-mastery4-brown', championLevel === 4],
          ['bg-mastery-beige', championLevel < 4],
        )}
        title={name}
      >
        <div className="w-12 h-12 overflow-hidden">
          <img
            src={staticData.assets.champion.square(championId)}
            alt={`${name}'s icon`}
            className="max-w-none w-[calc(100%_+_6px)] m-[-3px]"
          />
        </div>
        <div
          className="absolute top-0 left-0 w-[14px] h-4 text-xs bg-black flex justify-center pr-[2px] rounded-br-lg overflow-hidden"
          title={nameLevelTokens}
        >
          <span className="mt-[-2px]">{championLevel}</span>
        </div>
        <Tokens championLevel={championLevel} tokensEarned={tokensEarned} title={nameLevelTokens} />
        {chestGranted ? (
          <div
            title={`${name} - coffre obtenu`}
            className="h-[15px] w-[18px] absolute left-0 bottom-0 bg-black flex flex-col-reverse rounded-tr"
          >
            <img src={Assets.chest} alt="Chest icon" className="w-4" />
          </div>
        ) : null}
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
      const alt = `Mastery ${championLevel + 1} token`
      return (
        <span
          title={title}
          className={cssClasses(
            'flex absolute left-[13px] top-0 bg-black h-[10px] rounded-br pl-[2px]',
            ['gap-[2px] pt-[1px] pb-[2px] pr-[2px]', championLevel === 5],
            ['gap-[3px] pb-[1px] pr-[3px]', championLevel === 6],
          )}
        >
          {pipe(
            repeatElements(tokensEarned, i => (
              <img key={i} src={src} alt={alt} className="bg-cover h-full" />
            )),
            List.concat(
              repeatElements(totalTockens - tokensEarned, i => (
                <img
                  key={totalTockens - i}
                  src={src}
                  alt={`${alt} (not earned)`}
                  className="grayscale bg-cover h-full"
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
