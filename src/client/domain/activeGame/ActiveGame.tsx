import { pipe } from 'fp-ts/function'
import { createElement, useEffect, useMemo, useRef, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { Business } from '../../../shared/Business'
import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import { MapId } from '../../../shared/models/api/MapId'
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { Dict } from '../../../shared/utils/fp'
import { List, Maybe } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { SummonerSpell } from '../../components/SummonerSpell'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { appRoutes } from '../../router/AppRouter'
import { NumberUtils } from '../../utils/NumberUtils'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { cx } from '../../utils/cx'
import type { ChampionMasterySquareProps } from '../summonerMasteries/ChampionMasterySquare'
import { ChampionMasterySquare } from '../summonerMasteries/ChampionMasterySquare'

const { round } = NumberUtils
const { cleanSummonerName, pad10 } = StringUtils

const clockInterval = MsDuration.second(1)

const gridTeamCols = 5 // should be children count returned by Participant
const gridTotalCols = 2 * gridTeamCols + 1

const gridTemplateColumns = `repeat(${gridTeamCols},auto) 1fr repeat(${gridTeamCols},auto)`

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(
        apiRoutes.summoner.byName(platform, cleanSummonerName(summonerName)).activeGame.get,
        {},
        [Maybe.decoder(ActiveGameView.codec), 'Maybe<ActiveGameView>'],
      ),
    )(
      Maybe.fold(
        () => (
          <div className="flex justify-center">
            <pre className="mt-4">pas en partie.</pre>
          </div>
        ),
        game => <WithoutAdditional platform={platform} game={game} />,
      ),
    )}
  </MainLayout>
)

const WithoutAdditional: React.FC<
  Omit<ActiveGameComponentProps, 'additionalStaticData'>
> = props => {
  const { lang } = useStaticData()

  return basicAsyncRenderer(
    useSWRHttp(apiRoutes.staticData.lang(lang).additional.get, {}, [
      AdditionalStaticData.codec,
      'AdditionalStaticData',
    ]),
  )(additionalStaticData => <ActiveGameComponent {...{ ...props, additionalStaticData }} />)
}

type ActiveGameComponentProps = {
  additionalStaticData: AdditionalStaticData
  platform: Platform
  game: ActiveGameView
}

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({
  additionalStaticData,
  platform,
  game: { gameStartTime, mapId, gameQueueConfigId, bannedChampions, participants },
}) => {
  const { champions, assets } = useStaticData()

  const groupedBans = pipe(
    bannedChampions,
    List.match(
      () => null,
      List.groupBy(c => `${c.teamId}`),
    ),
  )

  const groupedParticipants = useMemo(
    () =>
      pipe(
        participants,
        List.groupBy(p => `${p.teamId}`),
      ),
    [participants],
  )

  const [gameDuration, setGameDuration] = useState(() =>
    pipe(DayJs.now(), DayJs.diff(gameStartTime)),
  )

  useEffect(() => {
    const id = window.setInterval(
      () => setGameDuration(MsDuration.add(clockInterval)),
      MsDuration.unwrap(clockInterval),
    )
    return () => window.clearInterval(id)
  }, [])

  return (
    <div>
      <h2 className="flex flex-wrap items-baseline gap-4">
        <span className="text-lg text-goldenrod">{GameQueue.label[gameQueueConfigId]}</span>
        <span className="flex text-grey-400">
          (<pre>{prettyMs(gameDuration)}</pre>)
        </span>
      </h2>

      {groupedBans !== null ? (
        <div className="flex justify-between">
          {TeamId.values.map(teamId => (
            <ul key={teamId} className="flex gap-1">
              {groupedBans[teamId]?.map(({ pickTurn, championId }) => {
                const champion = champions.find(c => ChampionKey.Eq.equals(c.key, championId))
                return (
                  <li key={ChampionKey.unwrap(championId)}>
                    <img
                      src={assets.champion.square(championId)}
                      alt={`Icône de ${champion?.name ?? `<Champion ${championId}>`}`}
                      className="w-12"
                    />
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      ) : null}

      <div className="grid gap-y-3" style={{ gridTemplateColumns }}>
        {TeamId.values.map((teamId, i) => (
          <ul key={teamId} className="contents">
            {groupedParticipants[teamId]?.map((participant, j) => (
              <Participant
                key={participant.summonerName}
                additionalStaticData={additionalStaticData}
                platform={platform}
                mapId={mapId}
                participant={participant}
                reverse={i % 2 === 1}
                index={j}
              />
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

const prettyMs = (ms: MsDuration): string => {
  const date = DayJs.of(MsDuration.unwrap(ms))
  const zero = DayJs.of(0)

  const d = pipe(date, DayJs.diff(zero, 'days'))
  const h = DayJs.hour.get(date)
  const m = DayJs.minute.get(date)
  const s = DayJs.second.get(date)

  return `${pad10(d * 24 + h)}:${pad10(m)}:${pad10(s)}`
}

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
  additionalStaticData: AdditionalStaticData
  platform: Platform
  mapId: MapId
  participant: ActiveGameParticipantView
  reverse: boolean
  /**
   * index inside of team
   */
  index: number
}

const Participant: React.FC<ParticipantProps> = ({
  additionalStaticData: { summonerSpells },
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
  const squareProps =
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
        }
      : undefined

  const percentsRef = useRef<HTMLSpanElement>(null)
  const totalMasteriesRef = useRef<HTMLSpanElement>(null)

  const children = [
    child('div', 1)(
      {},
      <img
        src={assets.summonerIcon(profileIconId)}
        alt={`Icône de ${summonerName}`}
        className="w-12"
      />,
    ),
    child('div', 2)(
      { className: 'flex items-end' },
      pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League queue="soloDuo" league={l.soloDuo} />,
        ),
      ),
    ),
    child('div', 3)(
      { className: 'flex items-end' },
      pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League queue="flex" league={l.flex} />,
        ),
      ),
    ),
    child('div', 2)(
      {
        className: cx('col-span-2 self-start flex items-baseline gap-1.5 !bg-transparent text-xs', [
          'justify-end',
          reverse,
        ]),
      },
      <a
        href={appRoutes.platformSummonerName(platform, summonerName, {})}
        target="_blank"
        rel="noreferrer"
        className="text-base text-goldenrod"
      >
        {summonerName}
      </a>,
      pipe(
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
      ),
    ),
    child('ul', 4)(
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
    child('div', 5)(
      {},
      squareProps !== undefined ? (
        <ChampionMasterySquare {...squareProps} />
      ) : (
        <span>Champion {ChampionKey.unwrap(championId)}</span>
      ),
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

const teamBg: Dict<`${TeamId}`, string> = {
  100: 'bg-mastery-7-bis/30',
  200: 'bg-mastery-5-bis/30',
}
