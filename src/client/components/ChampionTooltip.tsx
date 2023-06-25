import { pipe } from 'fp-ts/function'

import { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { StringUtils } from '../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import { cx } from '../utils/cx'
import { ChampionFactionImg } from './ChampionFactionImg'
import { ChampionPositionImg } from './ChampionPositionImg'

const { plural } = StringUtils

type Props = {
  chestGranted: boolean
  tokensEarned: number
  championLevel: ChampionLevelOrZero
  championPoints: number
  championPointsUntilNextLevel: number
  name: string
  percents: number
  filteredShardsCount: Maybe<number>
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
}

export const ChampionTooltip: React.FC<Props> = ({
  championLevel,
  percents,
  championPoints,
  championPointsUntilNextLevel,
  name,
  chestGranted,
  tokensEarned,
  filteredShardsCount,
  positions,
  factions,
}) => {
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
    <div className="flex flex-col">
      <div className="relative flex overflow-hidden border-b border-tooltip">
        {/* "hitbox" */}
        {percentsElement}
        <div className="absolute left-0">
          <span className="absolute -right-2 -top-4 h-[200%] w-[200%] rotate-12 bg-goldenrod-bis shadow-inner shadow-black" />
          {percentsElement}
        </div>
        <h3
          className={cx(
            'grow py-0.5 pl-4 pr-2 text-center font-bold shadow-black text-shadow',
            bgGradientMastery(championLevel),
          )}
        >
          {name}
        </h3>
      </div>
      <p className="border-b border-tooltip px-2 py-1 text-center">
        {`${championPoints.toLocaleString()}${
          0 < championLevel && championLevel < 5
            ? ` / ${(championPoints + championPointsUntilNextLevel).toLocaleString()}`
            : ''
        }  pts`}
      </p>
      <div className="flex grow flex-col items-center justify-center gap-1 px-2 py-1">
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
        <ul className="flex w-full max-w-[164px] flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
          {List.isNonEmpty(positions)
            ? pipe(
                positions,
                NonEmptyArray.map(position => (
                  <li key={position} className="flex items-center gap-0.5">
                    <ChampionPositionImg position={position} className="h-6 w-6 shrink-0 p-0.5" />
                    <span>{ChampionPosition.label[position]}</span>
                  </li>
                )),
              )
            : null}
          {List.isNonEmpty(factions)
            ? pipe(
                factions,
                NonEmptyArray.map(faction => (
                  <li key={faction} className="flex items-center gap-1.5">
                    <ChampionFactionImg faction={faction} className="h-5 w-5 text-wheat-bis" />
                    <span>{ChampionFaction.label[faction]}</span>
                  </li>
                )),
              )
            : null}
        </ul>
      </div>
    </div>
  )
}

export const bgGradientMastery = (level: ChampionLevelOrZero): string | undefined => {
  if (level === 7) return 'bg-gradient-to-r from-mastery-7 to-mastery-7-bis'
  if (level === 6) return 'bg-gradient-to-r from-mastery-6 to-mastery-6-bis'
  if (level === 5) return 'bg-gradient-to-r from-mastery-5 to-mastery-5-bis'
  if (level === 4) return 'bg-gradient-to-r from-mastery-4 to-mastery-4-bis'
  if (level === 0) return undefined
  return 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis'
}
