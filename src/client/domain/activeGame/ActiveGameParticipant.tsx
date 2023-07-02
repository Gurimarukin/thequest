import { pipe } from 'fp-ts/function'
import {
  Children,
  cloneElement,
  createElement,
  forwardRef,
  useCallback,
  useRef,
  useState,
} from 'react'

import { Business } from '../../../shared/Business'
import { MapId } from '../../../shared/models/api/MapId'
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import type { RuneId } from '../../../shared/models/api/perk/RuneId'
import type { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import type { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import type { Dict, List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import { AramTooltip } from '../../components/AramTooltip'
import type { ChampionMasterySquareProps } from '../../components/ChampionMasterySquare'
import { ChampionMasterySquare } from '../../components/ChampionMasterySquare'
import { League } from '../../components/League'
import { SummonerSpell } from '../../components/SummonerSpell'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useRefWithResize } from '../../hooks/useRefWithResize'
import { appRoutes } from '../../router/AppRouter'
import { cx } from '../../utils/cx'
import { ActiveGameAramStats } from './ActiveGameAramStats'
import { ActiveGameRunes } from './ActiveGameRunes'

const { round } = NumberUtils

export const gridTotalCols = 18

export const gridCols = 'grid-cols-[repeat(9,auto)_1fr]'
export const gridColsReverse = 'grid-cols-[1fr_repeat(8,auto)]'
export const xlGridCols = 'grid-cols-[1fr_repeat(16,auto)_1fr]'

const bevelWidth = 32 // px

const allLevels = new Set<ChampionLevelOrZero>(ChampionLevelOrZero.values)

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
  teamId: TeamId
  participant: ActiveGameParticipantView
  highlight: boolean
  reverse: boolean
  /**
   * index inside of team
   */
  index: number
}

export const ActiveGameParticipant: React.FC<ParticipantProps> = ({
  summonerSpellByKey,
  runeStyleById,
  runeById,
  platform,
  mapId,
  teamId,
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
  },
  highlight,
  reverse,
  index,
}) => {
  const { t } = useTranslation()
  const { championByKey, assets } = useStaticData()

  const percentsRef = useRef<HTMLSpanElement>(null)
  const totalMasteriesRef = useRef<HTMLSpanElement>(null)
  const championRef = useRef<HTMLDivElement>(null)
  const aramRef = useRef<HTMLDivElement>(null)

  const spell1 = summonerSpellByKey(spell1Id)
  const spell2 = summonerSpellByKey(spell2Id)

  const champion = championByKey(championId)
  const isHowlingAbyss = MapId.isHowlingAbyss(mapId)
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
        tooltipHoverRef: championRef,
        centerShards: true,
        noShadow: true,
      }),
    ),
  )

  const [bevelHeight, setBevelHeight] = useState(0)
  const onBevelMount = useRefWithResize<HTMLElement>(
    useCallback(e => setBevelHeight(e.offsetHeight), []),
  )

  const padding = reverse ? 'pr-2' : 'pl-2'

  return (
    <Li teamId={teamId} reverse={reverse} index={index}>
      <Cell
        gridColStart={1}
        className={
          highlight ? cx('border-goldenrod-bis', reverse ? 'border-r-4' : 'border-l-4') : undefined
        }
      />
      <Cell
        gridColStart={2}
        className={cx('flex items-end pb-2 pt-6', ['justify-end', reverse], padding)}
      >
        {pipe(
          leagues,
          Maybe.fold(
            () => null,
            l => <League variant="small" queue="soloDuo" league={l.soloDuo} reverse={reverse} />,
          ),
        )}
      </Cell>
      <Cell
        gridColStart={3}
        className={cx('flex items-end pb-2 pt-6', ['justify-end', reverse], padding)}
      >
        {pipe(
          leagues,
          Maybe.fold(
            () => null,
            l => <League variant="small" queue="flex" league={l.flex} reverse={reverse} />,
          ),
        )}
      </Cell>
      <Cell
        gridColStart={2}
        className={cx(
          'col-span-2 flex items-center gap-2 self-start !bg-transparent pt-2',
          ['flex-row-reverse', reverse],
          padding,
        )}
      >
        <div className="w-9">
          <img
            src={assets.summonerIcon(profileIconId)}
            alt={t.common.summonerIconAlt(summonerName)}
            className="w-full"
          />
        </div>
        <div className={cx('flex items-baseline gap-1.5 text-xs', ['flex-row-reverse', reverse])}>
          <a
            href={appRoutes.platformSummonerName(platform, summonerName, {
              view: 'histogram',
              level: allLevels,
            })}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap text-base text-goldenrod"
          >
            {summonerName}
          </a>
          {pipe(
            masteries,
            Maybe.fold(
              () => null,
              m => (
                <>
                  <span className="text-grey-400">—</span>
                  <span className="flex gap-1.5">
                    <span ref={percentsRef}>{t.common.percents(round(m.totalPercents, 1))}</span>
                    <Tooltip hoverRef={percentsRef}>{t.activeGame.theQuestProgression}</Tooltip>
                    <span ref={totalMasteriesRef} className="text-grey-400">
                      {t.common.number(m.totalScore, { withParenthesis: true })}
                    </span>
                    <Tooltip hoverRef={totalMasteriesRef}>{t.activeGame.totalMasteryScore}</Tooltip>
                  </span>
                </>
              ),
            ),
          )}
        </div>
      </Cell>
      <Cell
        type="ul"
        gridColStart={4}
        className={cx('flex flex-col items-center justify-between py-[13px]', padding)}
      >
        <li className="h-7 w-7">
          {pipe(
            spell1,
            Maybe.fold(
              () => <Empty className="h-full w-full">{t.common.spellKey(spell1Id)}</Empty>,
              s => <SummonerSpell spell={s} className="h-full w-full" />,
            ),
          )}
        </li>
        <li className="h-7 w-7">
          {pipe(
            spell2,
            Maybe.fold(
              () => <Empty className="h-full w-full">{t.common.spellKey(spell2Id)}</Empty>,
              s => <SummonerSpell spell={s} className="h-full w-full" />,
            ),
          )}
        </li>
      </Cell>
      <Cell gridColStart={5} className={cx('flex flex-col gap-px text-2xs', padding)}>
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
            props => (
              <>
                <span className="invisible">h</span>
                <div ref={championRef} className="flex flex-col items-center gap-px">
                  <ChampionMasterySquare {...props} />
                  <span className={cx(['invisible', props.championLevel < 5])}>
                    {t.common.numberK(round(props.championPoints / 1000, 1))}
                  </span>
                </div>
              </>
            ),
          ),
        )}
      </Cell>
      <Cell gridColStart={6} className={cx('flex', padding)}>
        {pipe(
          champion,
          Maybe.filter(() => isHowlingAbyss),
          Maybe.fold(
            () => null,
            c => (
              <>
                <div
                  ref={aramRef}
                  className={cx('flex w-full items-center gap-1.5 py-1 text-2xs', [
                    'flex-row-reverse',
                    reverse,
                  ])}
                >
                  <ActiveGameAramStats reverse={reverse} aram={c.aram} />
                </div>
                <Tooltip hoverRef={aramRef}>
                  <AramTooltip aram={c.aram} />
                </Tooltip>
              </>
            ),
          ),
        )}
      </Cell>
      <Cell gridColStart={7} className={cx('flex items-center py-1', padding)}>
        <ActiveGameRunes
          runeStyleById={runeStyleById}
          runeById={runeById}
          perks={perks}
          reverse={reverse}
        />
      </Cell>
      <Cell gridColStart={8} />
      <Cell
        ref={onBevelMount}
        gridColStart={9}
        className={cx('bg-transparent', ['justify-self-end', reverse])}
      >
        <div
          className={cx(
            teamBorder[teamId],
            reverse ? 'border-l-transparent' : 'border-b-transparent',
          )}
          style={{
            width: bevelWidth,
            borderLeftWidth: bevelWidth,
            borderBottomWidth: bevelHeight,
          }}
        />
      </Cell>
    </Li>
  )
}

type LiProps = {
  teamId: TeamId
  reverse: boolean
  index: number
  children: List<React.ReactElement> // should be List<CellElement>, but typing is poorly done :/
}

const Li: React.FC<LiProps> = ({ teamId, reverse, index, children }) => (
  <li className="contents">
    {Children.map<CellElement, CellElement>(children as List<CellElement>, element => {
      const { className, style, ...props_ } = element.props
      const props: RequiredCellElementProps = {
        ...props_,
        reverse,
        className: cx(className, teamBg[teamId]),
        style: { ...style, gridRowStart: index + 1 },
      }
      return cloneElement(element, props)
    })}
  </li>
)

const teamBg: Dict<`${TeamId}`, string> = {
  100: 'bg-mastery-7-bis/30',
  200: 'bg-mastery-5-bis/30',
}

const teamBorder: Dict<`${TeamId}`, string> = {
  100: 'border-mastery-7-bis/30',
  200: 'border-mastery-5-bis/30',
}

type CellProps = {
  type?: keyof React.ReactHTML
  gridColStart: number
} & BaseCellProps &
  HTMLElementProps

type BaseCellProps = {
  reverse?: boolean
}

type CellElementProps = BaseCellProps & HTMLElementProps
type RequiredCellElementProps = Required<BaseCellProps> & HTMLElementProps

type CellElement = React.DetailedReactHTMLElement<CellElementProps, HTMLElement>

type HTMLElementProps = React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement>

const Cell = forwardRef<HTMLElement, CellProps>(
  ({ type = 'div', gridColStart, reverse = false, style, children, ...props_ }, ref) => {
    const props: HTMLElementProps = {
      ...props_,
      ref,
      style: {
        ...style,
        gridColumnStart: reverse ? undefined : gridColStart,
        gridColumnEnd: reverse ? gridTotalCols - gridColStart + 2 : undefined,
      },
    }
    return createElement<HTMLElementProps, HTMLElement>(type, props, children)
  },
)

type EmptyProps = {
  className?: string
  children?: React.ReactNode
}

const Empty: React.FC<EmptyProps> = ({ className, children }) => (
  <div className={cx('bg-black text-2xs', className)}>{children}</div>
)
