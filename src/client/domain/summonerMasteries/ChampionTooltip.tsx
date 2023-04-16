import type { eq } from 'fp-ts'
import { string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import React from 'react'

import type { AramData } from '../../../shared/models/api/AramData'
import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { PercentsStats, WikiaStatsBalance } from '../../../shared/models/wikia/WikiaStatsBalance'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { Dict, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionPositionImg } from '../../components/ChampionPositionImg'
import { cssClasses } from '../../utils/cssClasses'
import { bgGradientMastery } from './ChampionMasterySquare'

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
    <span className="relative flex items-center py-0.5 pl-[6px] shadow-black text-shadow">
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
      <div className="relative col-span-2 flex overflow-hidden">
        {/* "hitbox" */}
        {percentsElement}
        <div className="absolute left-0">
          <span className="absolute -right-2 -top-4 h-[200%] w-[200%] rotate-12 bg-goldenrod-secondary shadow-inner shadow-black" />
          {percentsElement}
        </div>
        <span
          className={cssClasses(
            'grow py-0.5 pr-2 pl-4 text-center font-bold shadow-black text-shadow',
            bgGradientMastery(championLevel),
          )}
        >
          {name}
        </span>
      </div>
      <p className="border-b border-mastery4-brown-secondary px-2 py-1 text-center text-2xs">
        {`${championPoints.toLocaleString()}${
          0 < championLevel && championLevel < 5
            ? ` / ${(championPoints + championPointsUntilNextLevel).toLocaleString()}`
            : ''
        }  pts`}
      </p>
      {pipe(
        aram.stats,
        Maybe.chain(stats =>
          pipe(
            WikiaStatsBalance.keys,
            List.filterMap(key =>
              pipe(
                Dict.lookup(key, stats),
                Maybe.map(val => <Stat key={key} name={key} value={val} />),
              ),
            ),
            NonEmptyArray.fromReadonlyArray,
          ),
        ),
        Maybe.fold(
          () => <div className="row-span-2" />,
          nea => (
            <div className="row-span-2 flex flex-col items-center justify-center gap-1 border-l border-mastery4-brown-secondary p-1 text-2xs">
              <span>ARAM</span>
              <div className="grid grid-cols-[auto_auto] gap-x-[6px]">{nea}</div>
            </div>
          ),
        ),
      )}
      <div className="flex flex-col items-center justify-center gap-1 py-1 px-2 text-2xs">
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
    </>
  )
}

type StatProps = {
  name: keyof WikiaStatsBalance
  value: Exclude<WikiaStatsBalance[keyof WikiaStatsBalance], undefined>
}

const Stat = ({ name, value }: StatProps): JSX.Element => {
  const n = WikiaStatsBalance.isPercentsStats(name) ? (value * 1000 - 1000) / 10 : value
  const isMalusStat = List.elem(keysEq)(name, malusStats)
  const maybeUnit = List.elem(keysEq)(name, percentsUnits) ? Maybe.some('%') : Maybe.none
  return (
    <>
      <span className="font-mono">{WikiaStatsBalance.label[name]}</span>
      <span
        className={cssClasses(
          'flex gap-0.5 justify-self-end font-mono',
          ['text-green-600', isMalusStat ? n < 0 : 0 < n],
          ['text-red-600', isMalusStat ? 0 < n : n < 0],
        )}
      >
        <span>
          {n < 0 ? '' : '+'}
          {n.toLocaleString()}
        </span>
        {pipe(
          maybeUnit,
          Maybe.fold(
            () => null,
            u => <span>{u}</span>,
          ),
        )}
      </span>
    </>
  )
}

const keysEq: eq.Eq<keyof WikiaStatsBalance> = string.Eq

const malusStats: List<keyof WikiaStatsBalance> = ['dmg_taken']

const percentsUnits: List<keyof WikiaStatsBalance> = pipe(
  PercentsStats.values,
  List.difference(keysEq)(['tenacity']),
)
