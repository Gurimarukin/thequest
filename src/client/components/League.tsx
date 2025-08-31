import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import type { LeagueMiniSeriesProgress } from '../../shared/models/api/league/LeagueMiniSeriesProgress'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { LeagueView } from '../../shared/models/api/league/LeagueView'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import { Maybe } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { CheckMarkSharp, CloseFilled } from '../imgs/svgs/icons'
import { cx } from '../utils/cx'
import type { LeagueImgProps } from './LeagueImg'
import { LeagueImg } from './LeagueImg'
import { Tooltip } from './tooltip/Tooltip'

type Props = {
  /**
   * @default 'base'
   */
  variant?: 'base' | 'small'
  queue: keyof SummonerLeaguesView
  league: LeagueView
  /**
   * @default false
   */
  reverse?: boolean
  tooltipShouldHide?: boolean
  className?: string
}

type CurrentSplitAttrs = {
  tier: LeagueImgProps['tier']
  rank: LeagueRank
  description: React.ReactNode
  subDescription?: React.ReactNode
  currentSplitTooltip?: React.ReactNode
}

export const League: React.FC<Props> = ({
  variant = 'base',
  queue,
  league,
  reverse = false,
  tooltipShouldHide,
  className,
}) => {
  const { t } = useTranslation('common')

  const currentSplitRef = useRef<HTMLDivElement>(null)
  const currentSplitIconRef = useRef<HTMLSpanElement>(null)
  const previousSplitRef = useRef<HTMLImageElement>(null)

  const { tier, rank, description, subDescription, currentSplitTooltip } = pipe(
    league.currentSplit,
    Maybe.fold(
      (): CurrentSplitAttrs => ({
        tier: 'unranked',
        rank: 'I',
        description: t.league.unranked,
        subDescription: undefined,
      }),
      ({ leaguePoints, wins, losses, miniSeriesProgress, ...s }): CurrentSplitAttrs => {
        const tierRank = t.league.tierRank(
          s.tier,
          LeagueTier.isRegularTier(s.tier) ? s.rank : undefined,
        )
        const games = wins + losses
        return {
          tier: s.tier,
          rank: s.rank,
          description: (
            <>
              <span>{tierRank}</span>
              <span>{t.league.leaguePoints(leaguePoints)}</span>
            </>
          ),
          subDescription: (
            <span className="flex items-center gap-1">
              <span className="font-semibold">
                {t.percents(games === 0 ? 0 : Math.round((100 * wins) / games))}
              </span>
              <span className="text-grey-400">{t.number(games, { withParenthesis: true })}</span>
            </span>
          ),
          currentSplitTooltip: (
            <>
              {pipe(
                miniSeriesProgress,
                Maybe.fold(
                  () => null,
                  progress => (
                    <div className="col-span-2 mb-1 flex items-center gap-1 justify-self-center">
                      <span className="mr-1">{t.league.serie}</span>
                      {progress.map((p, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={i}>{renderProgress(p)}</span>
                      ))}
                    </div>
                  ),
                ),
              )}
              <WinLoss value={wins} label={t.league.wins} valueClassName="text-green" />
              <WinLoss value={losses} label={t.league.losses} valueClassName="text-red mb-0.5" />
            </>
          ),
        }
      },
    ),
  )

  const isSomeCurrentSplit = Maybe.isSome(league.currentSplit)

  return (
    <>
      <div
        ref={currentSplitRef}
        className={cx(
          '-mb-1 grid grid-cols-[auto_auto] items-center',
          ['gap-3', variant === 'base'],
          ['gap-2', variant === 'small'],
          className,
        )}
      >
        <LeagueImg
          ref={currentSplitIconRef}
          tier={tier}
          rank={rank}
          className={cx({
            'size-16': variant === 'base',
            'size-9': variant === 'small',
            'col-start-2': reverse,
          })}
        />
        <div
          className={cx(
            'flex text-sm',
            ['col-start-1 row-start-1', reverse],
            isSomeCurrentSplit
              ? cx('flex-col', reverse ? 'items-end' : 'items-start')
              : cx('items-center gap-2', ['flex-row-reverse', reverse]),
            ['leading-4', variant === 'small'],
          )}
        >
          <span
            className={cx('flex gap-1.5 whitespace-nowrap', {
              'font-semibold': isSomeCurrentSplit,
              'text-grey-400': variant === 'small',
            })}
          >
            {description}
          </span>
          <span className={cx('flex gap-3', ['flex-row-reverse', reverse])}>
            {subDescription}
            {pipe(
              league.previousSplit,
              Maybe.fold(
                () => null,
                s => (
                  <span ref={previousSplitRef} className="flex items-center text-grey-400">
                    (
                    <LeagueImg tier={s.tier} rank={s.rank} className="mx-0.5 size-5" />)
                  </span>
                ),
              ),
            )}
          </span>
        </div>
      </div>
      <Tooltip
        hoverRef={currentSplitRef}
        placementRef={currentSplitIconRef}
        shouldHide={tooltipShouldHide}
        className="grid grid-cols-[auto_auto] gap-x-1.5"
      >
        <span className="col-span-2 justify-self-center font-semibold">
          {t.league.label[queue]}
        </span>
        {currentSplitTooltip}
        {pipe(
          league.previousSplit,
          Maybe.fold(
            () => null,
            s => (
              <span className="col-span-2 flex items-center gap-1.5 whitespace-nowrap">
                <span>{t.league.previousSplit}</span>
                <span className="font-semibold">
                  {t.league.tierRank(s.tier, LeagueTier.isRegularTier(s.tier) ? s.rank : undefined)}
                </span>
              </span>
            ),
          ),
        )}
      </Tooltip>
    </>
  )
}

type WinLossProps = {
  value: number
  label: (n: number) => React.ReactNode
  valueClassName: string
}

const WinLoss: React.FC<WinLossProps> = ({ value, label, valueClassName }) => (
  <>
    <span className={cx('justify-self-end font-semibold', valueClassName)}>{value}</span>
    <span>{label(value)}</span>
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
