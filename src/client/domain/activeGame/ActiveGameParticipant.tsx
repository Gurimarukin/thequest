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
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { RuneId } from '../../../shared/models/api/perk/RuneId'
import type { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import type { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import type { Dict } from '../../../shared/utils/fp'
import { List, Maybe } from '../../../shared/utils/fp'

import type { ChampionMasterySquareProps } from '../../components/ChampionMasterySquare'
import { ChampionMasterySquare } from '../../components/ChampionMasterySquare'
import type { ChampionTooltipMasteries } from '../../components/ChampionTooltip'
import { League } from '../../components/League'
import { SummonerSpell } from '../../components/SummonerSpell'
import { MapChangesTooltip } from '../../components/mapChanges/MapChangesTooltip'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { useRefWithResize } from '../../hooks/useRefWithResize'
import { cx } from '../../utils/cx'
import { ActiveGameMapChangesStats } from './ActiveGameMapChangesStats'
import { ActiveGameRunes } from './ActiveGameRunes'
import { ActiveGameSummoner } from './ActiveGameSummoner'
import { ActiveGameTag } from './ActiveGameTag'

const { round } = NumberUtils

const gridTotalCols = 9

const bevelWidth = 32 // px

type Reverse = boolean

export const gridCols: Dict<`${Reverse}`, React.CSSProperties> = {
  false: { gridTemplateColumns: `1fr repeat(7,auto) ${bevelWidth}px` },
  true: { gridTemplateColumns: `${bevelWidth}px repeat(7,auto) 1fr` },
}

type StyleProps = Parameters<AnimatedComponent<'li'>>[0]['style'] // Merge<CSSProperties, TransformProps>;

type ParticipantProps = {
  summonerSpellByKey: (key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>
  runeStyleById: (id: RuneStyleId) => Maybe<StaticDataRuneStyle>
  runeById: (id: RuneId) => Maybe<StaticDataRune>
  platform: Platform
  /** GameMode */
  gameMode: string
  participant: ActiveGameParticipantView
  shouldWrap: boolean
  highlight: boolean
  reverse: boolean
  /**
   * index inside of team
   */
  index: number
  isLast: boolean
  isDragging: boolean
  springStyle: StyleProps
  gestureProps: ReactDOMAttributes
}

export const ActiveGameParticipant: React.FC<ParticipantProps> = ({
  summonerSpellByKey,
  runeStyleById,
  runeById,
  platform,
  gameMode,
  participant: {
    riotId,
    profileIconId,
    leagues,
    championId,
    masteries,
    shardsCount,
    spell1Id,
    spell2Id,
    perks: maybePerks,
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
  isLast,
  isDragging,
  springStyle,
  gestureProps,
}) => {
  const { t } = useTranslation()
  const { maybeUser } = useUser()
  const { championByKey } = useStaticData()

  const championRef = useRef<HTMLDivElement>(null)
  const championWinRateRef = useRef<HTMLDivElement>(null)
  const mapChangesRef = useRef<HTMLDivElement>(null)

  const spell1 = summonerSpellByKey(spell1Id)
  const spell2 = summonerSpellByKey(spell2Id)

  const champion = championByKey(championId)

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
        masteries: pipe(
          masteries,
          Maybe.chain(m => m.champion),
          Maybe.fold<ActiveGameChampionMasteryView, Maybe<ChampionTooltipMasteries>>(
            () =>
              pipe(
                riotId,
                Maybe.map(
                  (): ChampionTooltipMasteries => ({
                    tokensEarned: 0,
                    markRequiredForNextLevel: 0,
                    championLevel: 0,
                    championPoints: 0,
                    championPointsSinceLastLevel: 0,
                    championPointsUntilNextLevel: 0,
                    percents: 0,
                  }),
                ),
              ),
            m => Maybe.some({ ...m, percents: Business.championPercents(m) }),
          ),
          Maybe.toUndefined,
        ),
        tooltipShouldHide,
        centerShards: true,
        noShadow: true,
      }),
    ),
  )

  const [bevelHeight, setBevelHeight] = useState(0)
  const onBevelMount = useRefWithResize<HTMLElement>(
    useCallback(e => setBevelHeight(e.offsetHeight), []),
  )
  const bevelRotate = useMemo(() => Math.atan(bevelWidth / bevelHeight), [bevelHeight])

  const padding = reverse ? 'pr-2.5' : 'pl-2.5'

  return (
    <Li
      reverse={reverse}
      gridRowStart={3 * index + 1}
      springStyle={springStyle}
      gestureProps={gestureProps}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      {/* line 2 (tags) */}
      <Cell
        gridRowOffset={1}
        gridColStart={1}
        className={cx('h-4 text-xs', reverse ? 'col-span-9' : 'col-span-8')}
      >
        {List.isNonEmpty(tags) ? (
          <ul
            className={cx('flex items-center justify-end gap-1 px-2', {
              'flex-row-reverse': reverse,
            })}
          >
            {tags.map((tag, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <ActiveGameTag key={i} {...tag} />
            ))}
          </ul>
        ) : null}
      </Cell>

      {/* line 1 */}
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
              'absolute size-125 bg-current shadow-even shadow-black',
              reverse ? 'bottom-0 origin-bottom-left' : 'right-0 origin-top-right',
            )}
            style={{ transform: `rotate(${bevelRotate}rad)` }}
          />
        </div>
      </Cell>

      {highlight ? (
        <Cell
          gridColStart={1}
          className={cx('border-goldenrod-bis', reverse ? 'border-r-4' : 'border-l-4')}
        />
      ) : null}
      <Cell gridColStart={2} className={padding}>
        <ActiveGameSummoner
          {...{
            platform,
            riotId,
            profileIconId,
            masteries,
            premadeId,
            summonerLevel,
            role,
            mainRoles,
            reverse,
            tooltipShouldHide,
            padding,
          }}
        />
      </Cell>
      {pipe(
        leagues,
        Maybe.fold(
          () => null,
          ({ soloDuo, flex }) => (
            <Cell
              gridColStart={3}
              className={cx(
                'flex flex-col justify-center gap-3',
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
                className="-mt-0.5"
              />
              <League
                variant="small"
                queue="flex"
                league={flex}
                reverse={reverse}
                tooltipShouldHide={tooltipShouldHide}
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
                  <div className="whitespace-nowrap text-grey-400">
                    <span className="font-semibold text-green">{t.common.number(kills)}</span> /{' '}
                    <span className="font-semibold text-red">{t.common.number(deaths)}</span> /{' '}
                    <span className="font-semibold text-goldenrod">{t.common.number(assists)}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-semibold">{t.common.percents(percents)}</span>
                    <span className="text-grey-400">
                      {t.common.number(played, { withParenthesis: true })}
                    </span>
                  </div>
                </div>
                <Tooltip
                  hoverRef={championWinRateRef}
                  className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-1"
                >
                  <span className="justify-self-end font-semibold text-green">{wins}</span>
                  <span>{t.common.league.wins(wins)}</span>
                  <span className="justify-self-end font-semibold text-red">{losses}</span>
                  <span>{t.common.league.losses(losses)}</span>
                </Tooltip>
              </Cell>
            )
          },
        ),
      )}
      <Cell gridColStart={5} className={cx('flex flex-col gap-px py-1 text-xs leading-3', padding)}>
        {pipe(
          squareProps,
          Maybe.fold(
            () => (
              <>
                <span className="invisible">h</span>
                <div className="size-16 bg-black text-2xs">{t.common.championKey(championId)}</div>
                <span className="invisible">h</span>
              </>
            ),
            props => (
              <>
                <span className="invisible">h</span>
                {props.masteries === undefined || props.masteries.championLevel < 5 ? (
                  <>
                    <ChampionMasterySquare {...props} />
                    <span className="invisible">h</span>
                  </>
                ) : (
                  <div ref={championRef} className="flex flex-col items-center gap-px">
                    <ChampionMasterySquare tooltipHoverRef={championRef} {...props} />
                    <span className="font-medium">
                      {t.common.numberK(round(props.masteries.championPoints / 1000, 1))}
                    </span>
                  </div>
                )}
              </>
            ),
          ),
        )}
      </Cell>
      {pipe(
        champion,
        Maybe.chain(c => {
          switch (gameMode) {
            case 'ARAM':
              return Maybe.some(c.aram)

            case 'URF':
              return Maybe.some(c.urf)

            default:
              return Maybe.none
          }
        }),
        Maybe.fold(
          () => null,
          data => (
            <Cell gridColStart={6} className={cx('flex flex-col justify-center', padding)}>
              <ActiveGameMapChangesStats ref={mapChangesRef} reverse={reverse} data={data} />
              <Tooltip hoverRef={mapChangesRef} shouldHide={tooltipShouldHide}>
                <MapChangesTooltip data={data} />
              </Tooltip>
            </Cell>
          ),
        ),
      )}
      <Cell
        type={animated.ul}
        gridColStart={7}
        className={cx('flex flex-col items-center justify-center gap-2', padding)}
      >
        <li className="size-7">
          {pipe(
            spell1,
            Maybe.fold(
              () => <Empty className="size-full">{t.common.spellKey(spell1Id)}</Empty>,
              s => (
                <SummonerSpell
                  spell={s}
                  timerDisabled={Maybe.isNone(maybeUser)}
                  tooltipShouldHide={tooltipShouldHide}
                  className="size-full"
                />
              ),
            ),
          )}
        </li>
        <li className="size-7">
          {pipe(
            spell2,
            Maybe.fold(
              () => <Empty className="size-full">{t.common.spellKey(spell2Id)}</Empty>,
              s => (
                <SummonerSpell
                  spell={s}
                  timerDisabled={Maybe.isNone(maybeUser)}
                  tooltipShouldHide={tooltipShouldHide}
                  className="size-full"
                />
              ),
            ),
          )}
        </li>
      </Cell>
      {pipe(
        maybePerks,
        Maybe.fold(
          () => null,
          perks => (
            <Cell
              gridColStart={8}
              className={cx(
                'col-span-2 flex items-center py-1',
                reverse ? 'pl-4' : 'pr-4',
                padding,
              )}
            >
              <ActiveGameRunes
                runeStyleById={runeStyleById}
                runeById={runeById}
                perks={perks}
                reverse={reverse}
                tooltipShouldHide={tooltipShouldHide}
              />
            </Cell>
          ),
        ),
      )}

      {/* spacer */}
      {!isLast ? (
        <Cell gridRowOffset={2} gridColStart={1} className={shouldWrap ? 'h-1' : 'h-4'} />
      ) : null}
    </Li>
  )
}

type LiProps = {
  reverse: boolean
  gridRowStart: number
  springStyle: StyleProps
  gestureProps: ReactDOMAttributes
  className?: string
  children: List<React.ReactElement | null> // should be List<CellElement>, but typing is poorly done :/
}

const Li: React.FC<LiProps> = ({
  reverse,
  gridRowStart,
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
        const { gridRowOffset = 0, className, style, ...props_ } = element.props
        const props: RequiredCellElementProps = {
          ...gestureProps,
          ...props_,
          gridRowOffset,
          reverse,
          className: cx(baseClassName, className, 'touch-pinch-zoom select-none'),
          style: {
            ...style,
            gridRowStart: gridRowStart + gridRowOffset,
            ...(springStyle as React.CSSProperties),
          },
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
  /**
   * @default 0
   */
  gridRowOffset?: number
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gridRowOffset: _,
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
        gridColumnEnd: reverse ? gridTotalCols - gridColStart + 2 : undefined,
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
