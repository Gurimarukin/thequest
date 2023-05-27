import { pipe } from 'fp-ts/function'
import { createElement, useRef } from 'react'

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
import { appRoutes } from '../../router/AppRouter'
import { NumberUtils } from '../../utils/NumberUtils'
import { cx } from '../../utils/cx'
import type { ChampionMasterySquareProps } from '../summonerMasteries/ChampionMasterySquare'
import { ChampionMasterySquare } from '../summonerMasteries/ChampionMasterySquare'
import { gridTotalCols } from './ActiveGame'
import { ActiveGameRunes } from './ActiveGameRunes'

const { round } = NumberUtils

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

  const spell1 = summonerSpells.find(s => SummonerSpellKey.Eq.equals(s.key, spell1Id))
  const spell2 = summonerSpells.find(s => SummonerSpellKey.Eq.equals(s.key, spell2Id))

  const champion = champions.find(c => ChampionKey.Eq.equals(c.key, championId))
  const squareProps: ChampionMasterySquareProps | undefined =
    champion !== undefined
      ? {
          championId,
          name: champion.name,
          shardsCount: shardsCount === 0 ? Maybe.none : Maybe.some(shardsCount),
          positions: champion.positions,
          aram: MapId.isHowlingAbyss(mapId) ? Maybe.some(champion.aram) : Maybe.none,
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
          centerShards: true,
        }
      : undefined

  const percentsRef = useRef<HTMLSpanElement>(null)
  const totalMasteriesRef = useRef<HTMLSpanElement>(null)

  const children = [
    child('div', 1)(
      { className: 'flex items-end pt-6' },
      pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League queue="soloDuo" league={l.soloDuo} />,
        ),
      ),
    ),
    child('div', 2)(
      { className: 'flex items-end pt-6' },
      pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League queue="flex" league={l.flex} />,
        ),
      ),
    ),
    child('div', 1)(
      {
        className: cx('col-span-2 self-start flex items-center !bg-transparent', [
          'flex-row-reverse',
          reverse,
        ]),
      },
      <div className="w-6 rounded-sm border border-goldenrod-bis">
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
              <span ref={percentsRef}>{round(m.totalPercents, 1)}%</span>
              <Tooltip hoverRef={percentsRef}>Progression de La Quête</Tooltip>
              <span ref={totalMasteriesRef} className="text-grey-400">
                ({m.totalScore})
              </span>
              <Tooltip hoverRef={totalMasteriesRef}>Score total de maîtrise</Tooltip>
            </>
          )),
          Maybe.toNullable,
        )}
      </div>,
    ),
    child('ul', 3)(
      {},
      <li className="h-7">
        {spell1 !== undefined ? (
          <SummonerSpell spell={spell1} className="h-full" />
        ) : (
          <span>Sort {SummonerSpellKey.unwrap(spell1Id)}</span>
        )}
      </li>,
      <li className="h-7">
        {spell2 !== undefined ? (
          <SummonerSpell spell={spell2} className="h-full" />
        ) : (
          <span>Sort {SummonerSpellKey.unwrap(spell2Id)}</span>
        )}
      </li>,
    ),
    child('div', 4)(
      {},
      squareProps !== undefined ? (
        <ChampionMasterySquare {...squareProps} />
      ) : (
        <span>Champion {ChampionKey.unwrap(championId)}</span>
      ),
    ),
    child('div', 5)(
      { className: cx('flex items-center gap-1', ['flex-row-reverse', reverse]) },
      <ActiveGameRunes runeStyles={runeStyles} runes={runes} perks={perks} reverse={reverse} />,
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
