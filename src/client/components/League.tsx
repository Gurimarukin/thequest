import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import type { LeagueEntryView } from '../../shared/models/api/league/LeagueEntryView'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import type { Dict } from '../../shared/utils/fp'
import { Maybe } from '../../shared/utils/fp'

import { Assets } from '../imgs/Assets'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

type Attrs = {
  src: string
  alt: string
  description: React.ReactNode
  subDescription?: React.ReactNode
  tooltip?: React.ReactNode
}

type Props = {
  queue: keyof SummonerLeaguesView
  league: Maybe<LeagueEntryView>
  className?: string
}

export const League: React.FC<Props> = ({ queue, league, className }) => {
  const ref = useRef<HTMLDivElement>(null)

  const { src, alt, description, subDescription, tooltip } = pipe(
    league,
    Maybe.fold<LeagueEntryView, Attrs>(
      () => ({
        src: Assets.divisions.unranked,
        alt: 'non classé',
        description: 'Non classé',
        subDescription: undefined,
      }),
      ({ tier, rank, leaguePoints, wins, losses }) => {
        const tierRank = `${tierLabel[tier]}${LeagueTier.isFourRanks(tier) ? ` ${rank}` : ''}`
        const games = wins + losses
        return {
          src: LeagueTier.isFourRanks(tier)
            ? Assets.divisions[`${tier}${rank}`]
            : Assets.divisions[tier],
          alt: tierRank,
          tierRank,
          description: `${tierRank} ${leaguePoints} LP`,
          subDescription: (
            <>
              <span>{games === 0 ? 0 : Math.round((100 * wins) / games)}%</span>
              <span className="text-grey-400">({games})</span>
            </>
          ),
          tooltip: (
            <>
              <WinLoss value={wins} unit="victoire" valueClassName="text-green" />
              <WinLoss value={losses} unit="defaite" valueClassName="text-red" />
            </>
          ),
        }
      },
    ),
  )

  return (
    <>
      <div ref={ref} className={cx('-mb-1 flex items-center gap-2', className)}>
        <span className="h-10 w-10 overflow-hidden">
          <img
            src={src}
            alt={`Icône ${alt}`}
            className="m-[-3px] w-[calc(100%_+_6px)] max-w-none"
          />
        </span>
        <div className="flex flex-col text-xs">
          <span>{description}</span>
          {subDescription !== undefined ? (
            <span className="flex gap-1">{subDescription}</span>
          ) : null}
        </div>
      </div>
      <Tooltip hoverRef={ref} className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-1">
        <span
          className={cx('col-span-2 justify-self-center font-bold', [
            'pb-0.5',
            tooltip !== undefined,
          ])}
        >
          Classée {queueLabel[queue]}
        </span>
        {tooltip}
      </Tooltip>
    </>
  )
}

type WinLossProps = {
  value: number
  unit: string
  valueClassName: string
}

const WinLoss: React.FC<WinLossProps> = ({ value, unit, valueClassName }) => (
  <>
    <span className={cx('justify-self-end', valueClassName)}>{value}</span>
    <span>
      {unit}
      {value < 2 ? '' : 's'}
    </span>
  </>
)

const queueLabel: Dict<keyof SummonerLeaguesView, string> = {
  soloDuo: 'Solo/Duo',
  flex: 'FLEXXX',
}

const tierLabel: Dict<LeagueTier, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  DIAMOND: 'Diamant',
  MASTER: 'Maître',
  GRANDMASTER: 'Grand Maître',
  CHALLENGER: 'Challenger',
}
