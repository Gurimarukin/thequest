import { pipe } from 'fp-ts/function'

import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { cx } from '../utils/cx'
import { ChampionFactionImg } from './ChampionFactionImg'
import { ChampionPositionImg } from './ChampionPositionImg'

type Props = {
  chestGranted: boolean
  tokensEarned: number
  championLevel: ChampionLevel
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
  const { t } = useTranslation()

  const percentsElement = (
    <span className="relative flex items-center py-0.5 pl-1.5 font-semibold shadow-black text-shadow">
      {t.common.percents(Math.round(percents))}
    </span>
  )

  const tokenShards = pipe(
    [
      championLevel === 5 || championLevel === 6
        ? Maybe.some(<span key="tokens">{t.masteries.nTokens(tokensEarned)}</span>)
        : Maybe.none,
      pipe(
        filteredShardsCount,
        Maybe.map(shards => <span key="shards">{t.masteries.nShards(shards)}</span>),
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
          <span className="absolute -right-2 -top-4 size-[200%] rotate-12 bg-goldenrod-bis shadow-inner shadow-black" />
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
        {t.masteries.points(
          championPoints,
          0 < championLevel && championLevel < 5
            ? championPoints + championPointsUntilNextLevel
            : undefined,
          'font-semibold',
        )}
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
          <span>{chestGranted ? t.masteries.chestGranted : t.masteries.chestAvailable}</span>
        </div>
        <ChampionPositionsAndFactions positions={positions} factions={factions} />
      </div>
    </div>
  )
}

type ChampionPositionsAndFactionsProps = {
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
}

export const ChampionPositionsAndFactions: React.FC<ChampionPositionsAndFactionsProps> = ({
  positions,
  factions,
}) => {
  const { t } = useTranslation('common')

  return (
    <ul className="flex w-full max-w-[164px] flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
      {List.isNonEmpty(positions)
        ? pipe(
            positions,
            NonEmptyArray.map(position => (
              <li key={position} className="flex items-center gap-0.5">
                <ChampionPositionImg
                  position={position}
                  className="size-6 shrink-0 p-0.5 text-wheat-bis"
                />
                <span>{t.labels.position[position]}</span>
              </li>
            )),
          )
        : null}
      {List.isNonEmpty(factions)
        ? pipe(
            factions,
            NonEmptyArray.map(faction => (
              <li key={faction} className="flex items-center gap-1.5">
                <ChampionFactionImg faction={faction} className="size-5 text-wheat-bis" />
                <span>{t.labels.faction[faction]}</span>
              </li>
            )),
          )
        : null}
    </ul>
  )
}

export const bgGradientMastery = (level: ChampionLevel): string | undefined => {
  if (level === 7) return 'bg-gradient-to-r from-mastery-7 to-mastery-7-bis'
  if (level === 6) return 'bg-gradient-to-r from-mastery-6 to-mastery-6-bis'
  if (level === 5) return 'bg-gradient-to-r from-mastery-5 to-mastery-5-bis'
  if (level === 4) return 'bg-gradient-to-r from-mastery-4 to-mastery-4-bis'
  if (level === 0) return undefined
  return 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis'
}
