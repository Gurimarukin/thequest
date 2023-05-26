import { pipe } from 'fp-ts/function'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { Business } from '../../../shared/Business'
import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import { MapId } from '../../../shared/models/api/MapId'
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameMasteryView } from '../../../shared/models/api/activeGame/ActiveGameMasteryView'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { cx } from '../../utils/cx'
import type { ChampionMasterySquareProps } from '../summonerMasteries/ChampionMasterySquare'
import { ChampionMasterySquare } from '../summonerMasteries/ChampionMasterySquare'

const { cleanSummonerName, pad10 } = StringUtils

const clockInterval = MsDuration.second(1)

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
        game => <ActiveGameComponent platform={platform} game={game} />,
      ),
    )}
  </MainLayout>
)

type ActiveGameComponentProps = {
  platform: Platform
  game: ActiveGameView
}

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({
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

  const groupedParticipants = useMemo(() => groupParticipants(participants), [participants])

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
      <h2 className="flex gap-2 text-lg">
        <span className="text-goldenrod">{GameQueue.label[gameQueueConfigId]}</span>
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

      <ul className="grid grid-cols-[repeat(5,auto)_1fr_repeat(5,auto)] gap-y-3">
        {groupedParticipants.map((maybeParticipant, i) =>
          pipe(
            maybeParticipant,
            Maybe.fold(
              // eslint-disable-next-line react/no-array-index-key
              () => <span key={i} className="col-span-6" />, // span = repeat count + 1
              participant => (
                <Fragment key={participant.summonerName}>
                  <Participant platform={platform} mapId={mapId} participant={participant} />
                  {i % 2 === 0 ? <span /> : null}
                </Fragment>
              ),
            ),
          ),
        )}
      </ul>
    </div>
  )
}

const groupParticipants = (
  participants: List<ActiveGameParticipantView>,
): List<Maybe<ActiveGameParticipantView>> => {
  const grouped = pipe(
    participants,
    List.groupBy(p => `${p.teamId}`),
  )

  const p100 = pipe(grouped[100] ?? [], List.chunksOf(3))[0] ?? []
  const p200 = grouped[200] ?? []
  const size = Math.max(p100.length, p200.length)

  return pipe(
    p100,
    List.map(Maybe.some),
    ListUtils.padEnd(size, Maybe.none),
    List.zip(pipe(p200, List.map(Maybe.some), ListUtils.padEnd(size, Maybe.none))),
    List.flatten,
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
  platform: Platform
  mapId: MapId
  participant: ActiveGameParticipantView
}

const Participant: React.FC<ParticipantProps> = ({
  platform,
  mapId,
  participant: {
    teamId,
    summonerName,
    profileIconId,
    leagues,
    totalMasteryScore,
    championId,
    shardsCount,
    mastery,
    spell1Id,
    spell2Id,
    perks,
  },
}) => {
  const { champions, assets } = useStaticData()

  const isBlue = teamId === 100

  const squareProps = useMemo((): ChampionMasterySquareProps | undefined => {
    const champion = champions.find(c => ChampionKey.Eq.equals(c.key, championId))

    return champion !== undefined
      ? {
          championId,
          name: champion.name,
          shardsCount: shardsCount === 0 ? Maybe.none : Maybe.some(shardsCount),
          positions: champion.positions,
          aram: MapId.isHowlingAbyss(mapId) ? Maybe.some(champion.aram) : Maybe.none,
          setChampionShards: null,
          ...pipe(
            mastery,
            Maybe.fold<ActiveGameMasteryView, SquarePropsRest>(
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
  }, [championId, champions, mapId, mastery, shardsCount])

  const bg = isBlue ? 'bg-mastery-7-bis/30' : 'bg-mastery-6-bis/30'

  const children = [
    <span key="icon" className={bg}>
      <img
        src={assets.summonerIcon(profileIconId)}
        alt={`Icône de ${summonerName}`}
        className="w-12"
      />
    </span>,
    <div key="summoner" className={cx('flex flex-col', bg)}>
      <div className={cx('flex grow', ['justify-end', !isBlue])}>
        <a
          href={appRoutes.platformSummonerName(platform, summonerName, {})}
          target="_blank"
          rel="noreferrer"
        >
          {summonerName}
        </a>
      </div>
      {pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League queue="soloDuo" league={l.soloDuo} />,
        ),
      )}
    </div>,
    <div key="flex" className={bg}>
      {pipe(
        leagues,
        Maybe.fold(
          () => null,
          l => <League queue="flex" league={l.flex} />,
        ),
      )}
    </div>,
    <span key="champion" className={bg}>
      {squareProps !== undefined ? (
        <ChampionMasterySquare {...squareProps} />
      ) : (
        <span>Champion {ChampionKey.unwrap(championId)}</span>
      )}
    </span>,
    <span key="empty" className={bg} />,
  ]

  return <li className="contents">{isBlue ? children : List.reverse(children)}</li>
}
