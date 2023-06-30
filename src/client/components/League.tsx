import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import type { LeagueEntryView } from '../../shared/models/api/league/LeagueEntryView'
import type { LeagueMiniSeriesProgress } from '../../shared/models/api/league/LeagueMiniSeriesProgress'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import type { Dict } from '../../shared/utils/fp'
import { Maybe } from '../../shared/utils/fp'

import { Assets } from '../imgs/Assets'
import { CheckMarkSharp, CloseFilled } from '../imgs/svgIcons'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

type Props = {
  /**
   * @default 'base'
   */
  variant?: 'base' | 'small'
  queue: keyof SummonerLeaguesView
  league: Maybe<LeagueEntryView>
  /**
   * @default false
   */
  reverse?: boolean
  className?: string
}

type Attrs = {
  src: string
  alt: string
  description: React.ReactNode
  subDescription?: React.ReactNode
  tooltip?: React.ReactNode
}

export const League: React.FC<Props> = ({
  variant = 'base',
  queue,
  league,
  reverse = false,
  className,
}) => {
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
      ({ tier, rank, leaguePoints, wins, losses, miniSeriesProgress }) => {
        const tierRank = `${LeagueTier.label[tier]}${
          LeagueTier.isFourRanks(tier) ? ` ${rank}` : ''
        }`
        const games = wins + losses
        return {
          src: LeagueTier.isFourRanks(tier)
            ? Assets.divisions[`${tier}${rank}`]
            : Assets.divisions[tier],
          alt: tierRank,
          tierRank,
          description: (
            <>
              <span>{tierRank}</span>
              <span>{leaguePoints} LP</span>
            </>
          ),
          subDescription: (
            <>
              <span>{games === 0 ? 0 : Math.round((100 * wins) / games)}%</span>
              <span className="text-grey-400">({games})</span>
            </>
          ),
          tooltip: (
            <>
              {pipe(
                miniSeriesProgress,
                Maybe.fold(
                  () => null,
                  progress => (
                    <div className="col-span-2 mb-1 flex items-center gap-1 justify-self-center">
                      <span className="mr-1">Série :</span>
                      {progress.map((p, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={i}>{renderProgress(p)}</span>
                      ))}
                    </div>
                  ),
                ),
              )}
              <WinLoss value={wins} unit="victoire" valueClassName="text-green" />
              <WinLoss value={losses} unit="défaite" valueClassName="text-red" />
            </>
          ),
        }
      },
    ),
  )

  return (
    <>
      <div
        ref={ref}
        className={cx(
          '-mb-1 grid grid-cols-[auto_auto] items-center',
          ['gap-2', variant === 'base'],
          ['gap-1.5', variant === 'small'],
          className,
        )}
      >
        <span
          className={cx(
            'overflow-hidden',
            ['h-10 w-10', variant === 'base'],
            ['h-7 w-7', variant === 'small'],
            ['col-start-2', reverse],
          )}
        >
          <img src={src} alt={`Icône ${alt}`} className="m-[-7.5%] w-[115%] max-w-none" />
        </span>
        <div className={cx('flex flex-col text-xs', ['col-start-1 row-start-1', reverse])}>
          <span className="flex gap-1.5 whitespace-nowrap">{description}</span>
          {subDescription !== undefined ? (
            <span className={cx('flex gap-1', ['justify-end', reverse])}>{subDescription}</span>
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

const renderProgress = (progress: LeagueMiniSeriesProgress): React.ReactElement => {
  switch (progress) {
    case 'W':
      return <CheckMarkSharp className="h-4 text-green" />
    case 'L':
      return <CloseFilled className="h-4 text-red" />
    case 'N':
      return <span>—</span>
  }
}

const queueLabel: Dict<keyof SummonerLeaguesView, string> = {
  soloDuo: 'Solo/Duo',
  flex: 'FLEXXX',
}
