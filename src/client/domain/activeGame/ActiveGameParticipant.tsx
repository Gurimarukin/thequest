import { type AnimatedComponent, animated } from '@react-spring/web'
import type { ReactDOMAttributes } from '@use-gesture/react/dist/declarations/src/types'
import { pipe } from 'fp-ts/function'
import {
  Children,
  cloneElement,
  createElement,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Business } from '../../../shared/Business'
import { MapId } from '../../../shared/models/api/MapId'
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { RuneId } from '../../../shared/models/api/perk/RuneId'
import type { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import type { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { AramTooltip } from '../../components/AramTooltip'
import type { ChampionMasterySquareProps } from '../../components/ChampionMasterySquare'
import { ChampionMasterySquare } from '../../components/ChampionMasterySquare'
import { ChampionPositionImg } from '../../components/ChampionPositionImg'
import { League } from '../../components/League'
import { SummonerSpell } from '../../components/SummonerSpell'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useRefWithResize } from '../../hooks/useRefWithResize'
import { PeopleSharp } from '../../imgs/svgs/icons'
import { appRoutes } from '../../router/AppRouter'
import { TranslationUtils } from '../../utils/TranslationUtils'
import { cx } from '../../utils/cx'
import { ActiveGameAramStats } from './ActiveGameAramStats'
import { ActiveGameRunes } from './ActiveGameRunes'

const { round } = NumberUtils

export const gridTotalColsMobile = 10
export const gridTotalColsDesktop = 18

const bevelWidth = 32 // px

export const gridColsMobile = 'grid-cols-[repeat(8,auto)_32px_1fr]'
export const gridColsReverseMobile = 'grid-cols-[1fr_32px_repeat(8,auto)]'
export const gridColsDesktop = 'grid-cols-[1fr_repeat(7,auto)_32px_32px_repeat(7,auto)_1fr]'

const allLevels = new Set<ChampionLevelOrZero>(ChampionLevelOrZero.values)

type StyleProps = Parameters<AnimatedComponent<'li'>>[0]['style'] // Merge<CSSProperties, TransformProps>;

type SquarePropsRest = Pick<
  ChampionMasterySquareProps,
  | 'chestGranted'
  | 'tokensEarned'
  | 'championLevel'
  | 'championPoints'
  | 'championPointsSinceLastLevel'
  | 'championPointsUntilNextLevel'
  | 'percents'
>

type ParticipantProps = {
  summonerSpellByKey: (key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>
  runeStyleById: (id: RuneStyleId) => Maybe<StaticDataRuneStyle>
  runeById: (id: RuneId) => Maybe<StaticDataRune>
  platform: Platform
  mapId: MapId
  participant: ActiveGameParticipantView
  shouldWrap: boolean
  highlight: boolean
  reverse: boolean
  /**
   * index inside of team
   */
  index: number
  isDragging: boolean
  springStyle: StyleProps
  gestureProps: ReactDOMAttributes
}

export const ActiveGameParticipant: React.FC<ParticipantProps> = ({
  summonerSpellByKey,
  runeStyleById,
  runeById,
  platform,
  mapId,
  participant: {
    summonerName,
    profileIconId,
    leagues,
    championId,
    masteries,
    shardsCount,
    spell1Id,
    spell2Id,
    perks,
    premadeId,
    summonerLevel,
    championRankedStats,
    role,
    mainRoles,
    tags,
  },
  shouldWrap,
  highlight,
  reverse,
  index,
  isDragging,
  springStyle,
  gestureProps,
}) => {
  const { t } = useTranslation()
  const { championByKey, assets } = useStaticData()

  const summonerLevelRef = useRef<HTMLSpanElement>(null)
  const percentsRef = useRef<HTMLSpanElement>(null)
  const totalMasteriesRef = useRef<HTMLSpanElement>(null)
  const mainRolesRef = useRef<HTMLUListElement>(null)
  const championRef = useRef<HTMLDivElement>(null)
  const championWinRateRef = useRef<HTMLDivElement>(null)
  const aramRef = useRef<HTMLDivElement>(null)

  const spell1 = summonerSpellByKey(spell1Id)
  const spell2 = summonerSpellByKey(spell2Id)

  const champion = championByKey(championId)

  const isHowlingAbyss = MapId.isHowlingAbyss(mapId)
  const tooltipShouldHide = isDragging

  const squareProps = pipe(
    champion,
    Maybe.map(
      (c): ChampionMasterySquareProps => ({
        championId,
        name: c.name,
        shardsCount: pipe(
          shardsCount,
          Maybe.filter(n => n !== 0),
        ),
        positions: c.positions,
        factions: c.factions,
        setChampionShards: null,
        ...pipe(
          masteries,
          Maybe.chain(m => m.champion),
          Maybe.fold<ActiveGameChampionMasteryView, SquarePropsRest>(
            () => ({
              chestGranted: false,
              tokensEarned: 0,
              championLevel: 0,
              championPoints: 0,
              championPointsSinceLastLevel: 0,
              championPointsUntilNextLevel: 0,
              percents: 0,
            }),
            m => ({ ...m, percents: Business.championPercents(m) }),
          ),
        ),
        tooltipShouldHide,
        centerShards: true,
        noShadow: true,
        draggable: false,
      }),
    ),
  )

  const [bevelHeight, setBevelHeight] = useState(0)
  const onBevelMount = useRefWithResize<HTMLElement>(
    useCallback(e => setBevelHeight(e.offsetHeight), []),
  )
  const bevelRotate = useMemo(() => Math.atan(bevelWidth / bevelHeight), [bevelHeight])

  const padding = reverse ? 'pr-2' : 'pl-2'

  return (
    <Li
      shouldWrap={shouldWrap}
      reverse={reverse}
      index={index}
      springStyle={springStyle}
      gestureProps={gestureProps}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <Cell gridColStart={1} className="col-span-8 bg-current shadow-even shadow-black" />
      <Cell
        ref={onBevelMount}
        gridColStart={8}
        dontResetColor={true}
        className="col-span-2 overflow-hidden"
      >
        <div className="relative" style={{ height: bevelHeight }}>
          <div
            className={cx(
              'absolute h-[500px] w-[500px] bg-current shadow-even shadow-black',
              reverse ? 'bottom-0 origin-bottom-left' : 'right-0 origin-top-right',
            )}
            style={{ transform: `rotate(${bevelRotate}rad)` }}
          />
        </div>
      </Cell>

      <Cell
        gridColStart={1}
        className={
          highlight ? cx('border-goldenrod-bis', reverse ? 'border-r-4' : 'border-l-4') : undefined
        }
      />
      <Cell gridColStart={2} className={padding}>
        <div className="flex flex-col justify-center gap-1 pt-0.5">
          <div className={cx('flex items-center gap-3', ['flex-row-reverse', reverse])}>
            {pipe(
              premadeId,
              Maybe.fold(
                () => null,
                id => (
                  <div
                    className={cx('flex items-center gap-1 text-xs text-white', padding, [
                      'flex-row-reverse',
                      !reverse,
                    ])}
                  >
                    <PeopleSharp className="h-3" />
                    <span>{id}</span>
                  </div>
                ),
              ),
            )}
            <div className={cx('flex grow', reverse ? 'justify-start' : 'justify-end')}>
              <a
                href={appRoutes.platformSummonerName(platform, summonerName, {
                  view: 'histogram',
                  level: allLevels,
                })}
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap text-lg text-goldenrod"
              >
                {summonerName}
              </a>
            </div>
          </div>
          <div className={cx('flex items-start gap-2', ['flex-row-reverse', !reverse])}>
            <img
              src={assets.summonerIcon(profileIconId)}
              alt={t.common.summonerIconAlt(summonerName)}
              draggable={false}
              className="w-12"
            />
            <div
              className={cx(
                'flex flex-col gap-0.5 text-sm leading-4',
                reverse ? 'items-start' : 'items-end',
              )}
            >
              {pipe(
                summonerLevel,
                Maybe.fold(
                  () => null,
                  lvl => (
                    <>
                      <span ref={summonerLevelRef} className="text-grey-400">
                        {t.common.level(lvl)}
                      </span>
                      <Tooltip hoverRef={summonerLevelRef}>{t.common.summonerLevel}</Tooltip>
                    </>
                  ),
                ),
              )}
              {pipe(
                masteries,
                Maybe.fold(
                  () => null,
                  m => (
                    <div>
                      <span className="flex gap-1.5">
                        <span ref={percentsRef}>
                          {t.common.percents(round(m.questPercents, 1))}
                        </span>
                        <Tooltip hoverRef={percentsRef} shouldHide={tooltipShouldHide}>
                          {t.activeGame.theQuestProgression}
                        </Tooltip>

                        <span ref={totalMasteriesRef} className="text-grey-400">
                          {t.activeGame.totals(
                            m.totalMasteryLevel,
                            TranslationUtils.numberUnit(t.common)(m.totalMasteryPoints),
                          )}
                        </span>
                        <Tooltip
                          hoverRef={totalMasteriesRef}
                          className="flex flex-col items-center gap-2"
                        >
                          <span>{t.activeGame.masteryScoreAndPoints}</span>
                          <span>{t.activeGame.otpIndex(m.otpIndex)}</span>
                        </Tooltip>
                      </span>
                    </div>
                  ),
                ),
              )}
              {List.isEmpty(mainRoles) ? null : (
                <>
                  <ul ref={mainRolesRef} className="flex gap-1">
                    {mainRoles.map(r => (
                      <li key={r}>
                        <ChampionPositionImg
                          position={r}
                          className={cx('w-4', [
                            'text-white',
                            pipe(role, Maybe.elem(ChampionPosition.Eq)(r)),
                          ])}
                        />
                      </li>
                    ))}
                  </ul>
                  <Tooltip hoverRef={mainRolesRef}>{t.activeGame.mainRoles}</Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
      </Cell>
      {pipe(
        leagues,
        Maybe.fold(
          () => null,
          ({ soloDuo, flex }) => (
            <Cell
              gridColStart={3}
              className={cx(
                'flex flex-col justify-center gap-2.5',
                reverse ? 'items-end' : 'items-start',
                padding,
              )}
            >
              <League
                variant="small"
                queue="soloDuo"
                league={soloDuo}
                reverse={reverse}
                tooltipShouldHide={tooltipShouldHide}
                draggable={false}
                className="-mt-0.5"
              />
              <League
                variant="small"
                queue="flex"
                league={flex}
                reverse={reverse}
                tooltipShouldHide={tooltipShouldHide}
                draggable={false}
              />
            </Cell>
          ),
        ),
      )}
      {pipe(
        championRankedStats,
        Maybe.fold(
          () => null,
          ({ wins, losses, kills, deaths, assists }) => {
            const played = wins + losses
            const percents = played === 0 ? 0 : Math.round((100 * wins) / played)
            return (
              <Cell
                gridColStart={4}
                className={cx('flex flex-col justify-center text-sm', padding)}
              >
                <div
                  ref={championWinRateRef}
                  className={cx('flex flex-col', reverse ? 'items-start' : 'items-end')}
                >
                  <div className="text-grey-400">
                    <span className="text-green">{t.common.number(kills)}</span> /{' '}
                    <span className="text-red">{t.common.number(deaths)}</span> /{' '}
                    <span className="text-goldenrod">{t.common.number(assists)}</span>
                  </div>
                  <div className="flex gap-1">
                    <span>{t.common.percents(percents)}</span>
                    <span className="text-grey-400">
                      {t.common.number(played, { withParenthesis: true })}
                    </span>
                  </div>
                </div>
                <Tooltip
                  hoverRef={championWinRateRef}
                  className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-1"
                >
                  <span className="justify-self-end text-green">{wins}</span>
                  <span>{t.common.league.wins(wins)}</span>
                  <span className="justify-self-end text-red">{losses}</span>
                  <span>{t.common.league.losses(losses)}</span>
                </Tooltip>
              </Cell>
            )
          },
        ),
      )}
      <Cell gridColStart={5} className={cx('flex flex-col gap-px text-xs leading-3', padding)}>
        {pipe(
          squareProps,
          Maybe.fold(
            () => (
              <>
                <span className="invisible">h</span>
                <div className="h-16 w-16 bg-black text-2xs">
                  {t.common.championKey(championId)}
                </div>
                <span className="invisible">h</span>
              </>
            ),
            props => {
              const hidePoints = props.championLevel < 5
              return (
                <>
                  <span className="invisible">h</span>
                  {hidePoints ? (
                    <>
                      <ChampionMasterySquare {...props} />
                      <span className="invisible">h</span>
                    </>
                  ) : (
                    <div ref={championRef} className="flex flex-col items-center gap-px">
                      <ChampionMasterySquare tooltipHoverRef={championRef} {...props} />
                      <span>{t.common.numberK(round(props.championPoints / 1000, 1))}</span>
                    </div>
                  )}
                </>
              )
            },
          ),
        )}
      </Cell>
      {pipe(
        champion,
        // Maybe.filter(() => isHowlingAbyss),
        Maybe.fold(
          () => null,
          c => (
            <Cell gridColStart={6} className={cx('flex', padding)}>
              <div
                ref={aramRef}
                className={cx('flex w-full items-center gap-1.5 py-1 text-2xs', [
                  'flex-row-reverse',
                  reverse,
                ])}
              >
                <ActiveGameAramStats reverse={reverse} aram={c.aram} draggable={false} />
              </div>
              <Tooltip hoverRef={aramRef} shouldHide={tooltipShouldHide}>
                <AramTooltip aram={c.aram} />
              </Tooltip>
            </Cell>
          ),
        ),
      )}
      <Cell
        type={animated.ul}
        gridColStart={7}
        className={cx('flex flex-col items-center justify-between py-[13px]', padding)}
      >
        <li className="h-7 w-7">
          {pipe(
            spell1,
            Maybe.fold(
              () => <Empty className="h-full w-full">{t.common.spellKey(spell1Id)}</Empty>,
              s => (
                <SummonerSpell
                  spell={s}
                  tooltipShouldHide={tooltipShouldHide}
                  draggable={false}
                  className="h-full w-full"
                />
              ),
            ),
          )}
        </li>
        <li className="h-7 w-7">
          {pipe(
            spell2,
            Maybe.fold(
              () => <Empty className="h-full w-full">{t.common.spellKey(spell2Id)}</Empty>,
              s => (
                <SummonerSpell
                  spell={s}
                  tooltipShouldHide={tooltipShouldHide}
                  draggable={false}
                  className="h-full w-full"
                />
              ),
            ),
          )}
        </li>
      </Cell>
      <Cell
        gridColStart={8}
        className={cx('col-span-2 flex items-center py-1', reverse ? 'pl-4' : 'pr-4', padding)}
      >
        <ActiveGameRunes
          runeStyleById={runeStyleById}
          runeById={runeById}
          perks={perks}
          reverse={reverse}
          tooltipShouldHide={tooltipShouldHide}
          draggable={false}
        />
      </Cell>
    </Li>
  )
}

type LiProps = {
  shouldWrap: boolean
  reverse: boolean
  index: number
  springStyle: StyleProps
  gestureProps: ReactDOMAttributes
  className?: string
  children: List<React.ReactElement | null> // should be List<CellElement>, but typing is poorly done :/
}

const Li: React.FC<LiProps> = ({
  shouldWrap,
  reverse,
  index,
  springStyle,
  gestureProps,
  className: baseClassName,
  children,
}) => (
  <li className="contents">
    {Children.map<CellElement | null, CellElement | null>(
      children as List<CellElement | null>,
      element => {
        if (element === null) return null
        const { className, style, ...props_ } = element.props
        const props: RequiredCellElementProps = {
          ...gestureProps,
          ...props_,
          shouldWrap,
          reverse,
          className: cx(baseClassName, className, 'touch-pinch-zoom select-none'),
          style: { ...style, gridRowStart: index + 1, ...(springStyle as React.CSSProperties) },
        }
        return cloneElement(element, props)
      },
    )}
  </li>
)

type CellProps = {
  type?: AnimatedComponent<React.ElementType>
  gridColStart: number
  /**
   * @default false
   */
  dontResetColor?: boolean
} & BaseCellProps &
  HTMLElementProps

type BaseCellProps = {
  shouldWrap?: boolean
  reverse?: boolean
}

type CellElementProps = BaseCellProps & HTMLElementProps
type RequiredCellElementProps = Required<BaseCellProps> & HTMLElementProps

type CellElement = React.DetailedReactHTMLElement<CellElementProps, HTMLElement>

type HTMLElementProps = React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement>

const Cell = forwardRef<HTMLElement, CellProps>(
  (
    {
      type = animated.div,
      gridColStart,
      shouldWrap = false,
      reverse = false,
      dontResetColor,
      className,
      style,
      children,
      ...props_
    },
    ref,
  ) => {
    const props: HTMLElementProps = {
      ...props_,
      ref,
      className: cx(['[&>*]:text-wheat', dontResetColor !== true], className),
      style: {
        ...style,
        gridColumnStart: reverse ? undefined : gridColStart,
        gridColumnEnd: reverse
          ? shouldWrap
            ? gridTotalColsMobile - gridColStart + 2
            : gridTotalColsDesktop - gridColStart + 2
          : undefined,
      },
    }
    return createElement(type, props, children)
  },
)

type EmptyProps = {
  className?: string
  children?: React.ReactNode
}

const Empty: React.FC<EmptyProps> = ({ className, children }) => (
  <div className={cx('bg-black text-2xs', className)}>{children}</div>
)
