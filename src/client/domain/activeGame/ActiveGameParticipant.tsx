import { pipe } from 'fp-ts/function'
import { createElement, useCallback, useRef, useState } from 'react'

import { Business } from '../../../shared/Business'
import { MapId } from '../../../shared/models/api/MapId'
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import type { Dict, List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { SummonerSpell } from '../../components/SummonerSpell'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useRefWithResize } from '../../hooks/useRefWithResize'
import { appRoutes } from '../../router/AppRouter'
import { NumberUtils } from '../../utils/NumberUtils'
import { cx } from '../../utils/cx'
import type { ChampionMasterySquareProps } from '../summonerMasteries/ChampionMasterySquare'
import { ChampionMasterySquare } from '../summonerMasteries/ChampionMasterySquare'
import { ActiveGameAramStats } from './ActiveGameAramStats'
import { ActiveGameRunes } from './ActiveGameRunes'

const { round } = NumberUtils

export const gridTotalCols = 16

export const gridCols = 'grid-cols-[repeat(8,auto)_1fr]'
export const gridColsReverse = 'grid-cols-[1fr_repeat(7,auto)]'
export const xlGridCols = 'grid-cols-[1fr_repeat(14,auto)_1fr]'

const bevelWidth = 32 // px

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
  summonerSpells: List<StaticDataSummonerSpell>
  runeStyles: List<StaticDataRuneStyle>
  runes: List<StaticDataRune>
  platform: Platform
  mapId: MapId
  participant: ActiveGameParticipantView
  reverse: boolean
  /**
   * index inside of team
   */
  index: number
}

export const ActiveGameParticipant: React.FC<ParticipantProps> = ({
  summonerSpells,
  runeStyles,
  runes,
  platform,
  mapId,
  participant: {
    teamId,
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
  reverse,
  index,
}) => {
  const { champions, assets } = useStaticData()

  const percentsRef = useRef<HTMLSpanElement>(null)
  const totalMasteriesRef = useRef<HTMLSpanElement>(null)
  const championTooltipRef = useRef<HTMLDivElement>(null)

  const spell1 = summonerSpells.find(s => SummonerSpellKey.Eq.equals(s.key, spell1Id))
  const spell2 = summonerSpells.find(s => SummonerSpellKey.Eq.equals(s.key, spell2Id))

  const champion = champions.find(c => ChampionKey.Eq.equals(c.key, championId))
  const isHowlingAbyss = MapId.isHowlingAbyss(mapId)
  const squareProps: ChampionMasterySquareProps | undefined =
    champion !== undefined
      ? {
          championId,
          name: champion.name,
          shardsCount: pipe(
            shardsCount,
            Maybe.filter(c => c !== 0),
          ),
          positions: champion.positions,
          aram: isHowlingAbyss ? Maybe.some(champion.aram) : Maybe.none,
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
          tooltipHoverRef: championTooltipRef,
          centerShards: true,
          noShadow: true,
        }
      : undefined

  const [bevelHeight, setBevelHeight] = useState(0)
  const onBevelMount = useRefWithResize<HTMLElement>(
    useCallback(e => setBevelHeight(e.offsetHeight), []),
  )

  const padding = reverse ? 'pr-2' : 'pl-2'
  const children = [
    child('div', 1)({}),
    child('div', 2)(
      { className: cx('flex items-end pt-6 pb-2', ['justify-end', reverse], padding) },
      pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League variant="small" queue="soloDuo" league={l.soloDuo} reverse={reverse} />,
        ),
      ),
    ),
    child('div', 3)(
      { className: cx('flex items-end pt-6 pb-2', ['justify-end', reverse], padding) },
      pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League variant="small" queue="flex" league={l.flex} reverse={reverse} />,
        ),
      ),
    ),
    child('div', 2)(
      {
        className: cx(
          'col-span-2 self-start flex items-center gap-2 pt-2 !bg-transparent',
          ['flex-row-reverse', reverse],
          padding,
        ),
      },
      <div className="w-9">
        <img
          src={assets.summonerIcon(profileIconId)}
          alt={`Icône de ${summonerName}`}
          className="w-full"
        />
      </div>,
      <div className={cx('flex items-baseline gap-1.5 text-xs', ['flex-row-reverse', reverse])}>
        <a
          href={appRoutes.platformSummonerName(platform, summonerName, {})}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-base text-goldenrod"
        >
          {summonerName}
        </a>
        {pipe(
          masteries,
          Maybe.map(m => (
            <>
              <span className="text-grey-400">—</span>
              <span className="flex gap-1.5">
                <span ref={percentsRef}>{round(m.totalPercents, 1)}%</span>
                <Tooltip hoverRef={percentsRef}>Progression de La Quête</Tooltip>
                <span ref={totalMasteriesRef} className="text-grey-400">
                  ({m.totalScore})
                </span>
                <Tooltip hoverRef={totalMasteriesRef}>Score total de maîtrise</Tooltip>
              </span>
            </>
          )),
          Maybe.toNullable,
        )}
      </div>,
    ),
    child('ul', 4)(
      { className: cx('flex flex-col justify-between items-center py-[13px]', padding) },
      <li className="h-7 w-7">
        {spell1 !== undefined ? (
          <SummonerSpell spell={spell1} className="h-full w-full" />
        ) : (
          <Empty className="h-full w-full">Sort {SummonerSpellKey.unwrap(spell1Id)}</Empty>
        )}
      </li>,
      <li className="h-7 w-7">
        {spell2 !== undefined ? (
          <SummonerSpell spell={spell2} className="h-full w-full" />
        ) : (
          <Empty className="h-full w-full">Sort {SummonerSpellKey.unwrap(spell2Id)}</Empty>
        )}
      </li>,
    ),
    child('div', 5)(
      {
        ref: championTooltipRef,
        className: cx('flex items-center gap-1.5 text-2xs', ['flex-row-reverse', reverse], padding),
      },
      squareProps !== undefined ? (
        <div className="flex flex-col items-center gap-px">
          <span className="invisible">h</span>
          <ChampionMasterySquare {...squareProps} />
          <span className={cx(['invisible', squareProps.championLevel < 4])}>
            {round(squareProps.championPoints / 1000, 1).toLocaleString()}k
          </span>
        </div>
      ) : (
        <div className="h-16 w-16 bg-black text-2xs">Champion {ChampionKey.unwrap(championId)}</div>
      ),
      champion !== undefined && isHowlingAbyss ? (
        <ActiveGameAramStats reverse={reverse} aram={champion.aram} />
      ) : undefined,
    ),
    child('div', 6)(
      { className: cx('flex items-center', padding) },
      <ActiveGameRunes runeStyles={runeStyles} runes={runes} perks={perks} reverse={reverse} />,
    ),
    child('div', 7)({}),
    child('div', 8)(
      { ref: onBevelMount, className: cx('bg-transparent', ['justify-self-end', reverse]) },
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
      />,
    ),
  ]

  return (
    <li className="contents">
      {children.map((c, key) =>
        c(reverse, {
          key,
          className: teamBg[teamId],
          style: {
            gridRowStart: index + 1,
          },
        }),
      )}
    </li>
  )
}

const teamBg: Dict<`${TeamId}`, string> = {
  100: 'bg-mastery-7-bis/30',
  200: 'bg-mastery-5-bis/30',
}

const teamBorder: Dict<`${TeamId}`, string> = {
  100: 'border-mastery-7-bis/30',
  200: 'border-mastery-5-bis/30',
}

type BaseProps = {
  key: React.Key
  className?: string
  style?: React.CSSProperties
}

const child =
  <P extends React.HTMLAttributes<T>, T extends HTMLElement>(
    type: keyof React.ReactHTML,
    gridColStart: number,
  ) =>
  ({ className, style, ...props }: React.ClassAttributes<T> & P, ...children: React.ReactNode[]) =>
  (reverse: boolean, { key, className: baseClassName, style: baseStyle }: BaseProps) =>
    createElement(
      type,
      {
        key,
        className: cx(baseClassName, className),
        style: {
          ...baseStyle,
          ...style,
          gridColumnStart: reverse ? undefined : gridColStart,
          gridColumnEnd: reverse ? gridTotalCols - gridColStart + 2 : undefined,
        },
        ...props,
      },
      ...children,
    )

type EmptyProps = {
  className?: string
  children?: React.ReactNode
}

const Empty: React.FC<EmptyProps> = ({ className, children }) => (
  <div className={cx('bg-black text-2xs', className)}>{children}</div>
)
