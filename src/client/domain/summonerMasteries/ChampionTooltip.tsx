import { pipe } from 'fp-ts/function'
import React from 'react'

import type { AramData } from '../../../shared/models/api/AramData'
import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionPositionImg } from '../../components/ChampionPositionImg'
import { AramStatsFull } from '../../components/aramStats/AramStatsFull'
import { cssClasses } from '../../utils/cssClasses'

const { plural } = StringUtils

type ChampionTooltipProps = {
  // eslint-disable-next-line react/boolean-prop-naming
  chestGranted: boolean
  tokensEarned: number
  championLevel: ChampionLevelOrZero
  championPoints: number
  championPointsUntilNextLevel: number
  name: string
  percents: number
  filteredShardsCount: Maybe<number>
  positions: List<ChampionPosition>
  aram: AramData
}
export const ChampionTooltip = ({
  championLevel,
  percents,
  championPoints,
  championPointsUntilNextLevel,
  name,
  chestGranted,
  tokensEarned,
  filteredShardsCount,
  positions,
  aram,
}: ChampionTooltipProps): JSX.Element => {
  const percentsElement = (
    <span className="relative flex items-center py-0.5 pl-1.5 shadow-black text-shadow">
      {Math.round(percents)} %
    </span>
  )

  const tokenShards = pipe(
    [
      championLevel === 5 || championLevel === 6
        ? Maybe.some(<span key="tokens">{plural('jeton')(tokensEarned)}</span>)
        : Maybe.none,
      pipe(
        filteredShardsCount,
        Maybe.map(shards => <span key="shards">{plural('fragment')(shards)}</span>),
      ),
    ],
    List.compact,
    NonEmptyArray.fromReadonlyArray,
  )

  return (
    <>
      <div className="flex flex-col">
        <div className="relative flex overflow-hidden border-b border-mastery4-brown-secondary">
          {/* "hitbox" */}
          {percentsElement}
          <div className="absolute left-0">
            <span className="absolute -right-2 -top-4 h-[200%] w-[200%] rotate-12 bg-goldenrod-secondary shadow-inner shadow-black" />
            {percentsElement}
          </div>
          <h3
            className={cssClasses(
              'grow py-0.5 pr-2 pl-4 text-center font-bold shadow-black text-shadow',
              bgGradientMastery(championLevel),
            )}
          >
            {name}
          </h3>
        </div>
        <p className="border-b border-mastery4-brown-secondary px-2 py-1 text-center">
          {`${championPoints.toLocaleString()}${
            0 < championLevel && championLevel < 5
              ? ` / ${(championPoints + championPointsUntilNextLevel).toLocaleString()}`
              : ''
          }  pts`}
        </p>
        <div className="flex grow flex-col items-center justify-center gap-1 py-1 px-2">
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
          {List.isNonEmpty(positions) ? (
            <div className="flex">
              {pipe(
                positions,
                NonEmptyArray.map(position => (
                  <ChampionPositionImg
                    key={position}
                    position={position}
                    className="h-6 w-6 shrink-0 p-0.5"
                  />
                )),
              )}
            </div>
          ) : null}
        </div>
      </div>
      <AramStatsFull aram={aram} simpleStatsSpellsSplit={true}>
        {renderAramChildren}
      </AramStatsFull>
    </>
  )
}

const renderAramChildren = (
  children1: List<JSX.Element>,
  children2: List<JSX.Element>,
): JSX.Element => (
  <div className="grid grid-rows-[auto_1fr] items-center gap-1 border-l border-goldenrod-secondary px-2 pt-1 pb-1.5">
    <h4 className="text-center font-bold">ARAM</h4>
    <div className="flex items-center gap-2">
      {List.isNonEmpty(children1) ? (
        <ul className="grid grid-cols-[auto_auto_1fr] items-center gap-y-1">{children1}</ul>
      ) : null}
      {List.isNonEmpty(children2) ? (
        <ul className="grid max-w-xs grid-cols-[auto_auto_1fr] items-center gap-y-1">
          {children2}
        </ul>
      ) : null}
    </div>
  </div>
)

export const bgGradientMastery = (level: ChampionLevelOrZero): string => {
  if (level === 7) return 'bg-gradient-to-r from-mastery7-blue to-mastery7-blue-secondary'
  if (level === 6) return 'bg-gradient-to-r from-mastery6-violet to-mastery6-violet-secondary'
  if (level === 5) return 'bg-gradient-to-r from-mastery5-red to-mastery5-red-secondary'
  if (level === 4) return 'bg-gradient-to-r from-mastery4-brown to-mastery4-brown-secondary'
  if (level === 0) return 'bg-black'
  return 'bg-mastery-beige'
}
