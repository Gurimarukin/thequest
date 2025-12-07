import { pipe } from 'fp-ts/function'

import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { masteryHistogramGradient } from '../utils/colors'
import { cx } from '../utils/cx'
import { ChampionFactionImg } from './ChampionFactionImg'
import { ChampionPositionImg } from './ChampionPositionImg'

type Props = {
  masteries: ChampionTooltipMasteries | undefined
  name: string
  shardsCount: Maybe<number>
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
}

export type ChampionTooltipMasteries = {
  tokensEarned: number
  markRequiredForNextLevel: number
  championLevel: number
  championPoints: number
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
  percents: number
}

export const ChampionTooltip: React.FC<Props> = ({
  masteries,
  name,
  shardsCount,
  positions,
  factions,
}) => {
  const { t } = useTranslation()

  const percentsElement = (
    <span className="relative flex items-center py-0.5 pl-1.5 font-semibold shadow-black text-shadow">
      {masteries !== undefined
        ? t.common.percents(Math.round(masteries.percents))
        : t.masteries.unknownPercents}
    </span>
  )

  const tokenShards = pipe(
    [
      masteries !== undefined && 0 < masteries.markRequiredForNextLevel
        ? Maybe.some(
            <span key="tokens">
              {t.masteries.nMarksOfMastery(
                masteries.tokensEarned,
                masteries.markRequiredForNextLevel,
              )}
            </span>,
          )
        : Maybe.none,
      pipe(
        shardsCount,
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
            'grow py-0.5 pl-4 pr-2 text-center font-bold shadow-black',
            masteryHistogramGradient(masteries?.championLevel ?? 0),
          )}
        >
          {name}
        </h3>
      </div>
      <p className="border-b border-tooltip px-2 py-1 text-center">
        {masteries !== undefined
          ? t.masteries.points(
              masteries.championPoints,
              masteries.championPoints + masteries.championPointsUntilNextLevel,
              'font-semibold',
            )
          : t.masteries.unknownPoints('font-semibold')}
      </p>
      <div className="flex grow flex-col items-center justify-center gap-1 px-2 py-1">
        {pipe(
          tokenShards,
          Maybe.fold(
            () => null,
            nea => <div className="flex items-center gap-2">{nea}</div>,
          ),
        )}
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
    <ul className="flex w-full max-w-41 flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
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
