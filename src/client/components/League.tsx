import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import type { LeagueEntryView } from '../../shared/models/api/league/LeagueEntryView'
import type { LeagueMiniSeriesProgress } from '../../shared/models/api/league/LeagueMiniSeriesProgress'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import { Maybe } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { CheckMarkSharp, CloseFilled } from '../imgs/svgs/icons'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

const miniCrestIcon = (tier: 'unranked' | LeagueTier): string =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.svg`

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
  const { t } = useTranslation('common')

  const ref = useRef<HTMLDivElement>(null)

  const { src, alt, description, subDescription, tooltip } = pipe(
    league,
    Maybe.fold<LeagueEntryView, Attrs>(
      () => ({
        src: miniCrestIcon('unranked'),
        alt: t.league.unrankedIconAlt,
        description: t.league.unranked,
        subDescription: undefined,
      }),
      ({ tier, rank, leaguePoints, wins, losses, miniSeriesProgress }) => {
        const tierRank = t.league.tierRank(tier, LeagueTier.isRegularTier(tier) ? rank : undefined)
        const games = wins + losses
        return {
          src: miniCrestIcon(tier),
          alt: t.league.tierRankAlt(tier, LeagueTier.isRegularTier(tier) ? rank : undefined),
          tierRank,
          description: (
            <>
              <span>{tierRank}</span>
              <span>{t.league.leaguePoints(leaguePoints)}</span>
            </>
          ),
          subDescription: (
            <>
              <span>{t.percents(games === 0 ? 0 : Math.round((100 * wins) / games))}</span>
              <span className="text-grey-400">{t.number(games, { withParenthesis: true })}</span>
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

  return (
    <>
      <div
        ref={ref}
        className={cx(
          '-mb-1 grid grid-cols-[auto_auto] items-center gap-2 overflow-hidden',
          className,
        )}
      >
        <span
          className={cx(
            'flex justify-center',
            ['h-12 w-12', variant === 'base'],
            ['h-8 w-8', variant === 'small'],
            ['col-start-2', reverse],
          )}
        >
          <img
            src={src}
            alt={alt}
            className={cx('h-full object-contain', Maybe.isNone(league) ? 'w-[56.25%]' : 'w-full')}
          />
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
          {t.league.label[queue]}
        </span>
        {tooltip}
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
    <span className={cx('justify-self-end', valueClassName)}>{value}</span>
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
