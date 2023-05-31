/* eslint-disable functional/no-expression-statements */
import { number, ord } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import { useEffect, useMemo, useRef, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import type { Platform } from '../../../shared/models/api/Platform'
import { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import type { BannedChampion } from '../../../shared/models/api/activeGame/BannedChampion'
import { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import { DictUtils } from '../../../shared/utils/DictUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { Tuple } from '../../../shared/utils/fp'
import { List, Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useUser } from '../../contexts/UserContext'
import { usePlatformSummonerNameFromLocation } from '../../hooks/usePlatformSummonerNameFromLocation'
import { usePrevious } from '../../hooks/usePrevious'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { cx } from '../../utils/cx'
import { ActiveGameBans } from './ActiveGameBans'
import {
  ActiveGameParticipant,
  gridCols,
  gridColsReverse,
  gridTotalCols,
  xlGridCols,
} from './ActiveGameParticipant'
import { useShouldWrap } from './useShouldWrap'

const { cleanSummonerName, pad10 } = StringUtils

const clockInterval = MsDuration.second(1)

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => {
  const { maybeUser } = useUser()

  const { data, error, mutate } = useSWRHttp(
    apiRoutes.summoner.byName(platform, cleanSummonerName(summonerName)).activeGame.get,
    {},
    [Maybe.decoder(ActiveGameView.codec), 'Maybe<ActiveGameView>'],
  )

  // Remove shards on user disconnect
  const previousUser = usePrevious(maybeUser)
  useEffect(() => {
    if (
      data !== undefined &&
      Maybe.isNone(maybeUser) &&
      Maybe.isSome(Maybe.flatten(previousUser)) &&
      Maybe.isSome(data)
    ) {
      mutate(
        Maybe.some(
          pipe(
            ActiveGameView.Lens.participants,
            lens.modify(List.map(ActiveGameParticipantView.Lens.shardsCount.set(Maybe.none))),
          )(data.value),
        ),
        { revalidate: false },
      )
    }
  }, [data, maybeUser, mutate, previousUser])

  return (
    <MainLayout>
      {basicAsyncRenderer({ data, error })(
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
}

const WithoutAdditional: React.FC<Omit<ActiveGameComponentProps, 'additionalStaticData'>> = ({
  platform,
  game,
}) => {
  const { navigate } = useHistory()
  const { lang } = useStaticData()
  const summonerNameFromLocation = usePlatformSummonerNameFromLocation()?.summonerName

  // Correct case of summoner's name in url
  useEffect(() => {
    if (summonerNameFromLocation !== undefined) {
      pipe(
        game.participants,
        List.findFirst(
          p => cleanSummonerName(p.summonerName) === cleanSummonerName(summonerNameFromLocation),
        ),
        Maybe.filter(p => p.summonerName !== summonerNameFromLocation),
        Maybe.map(participant => {
          navigate(appRoutes.platformSummonerNameGame(platform, participant.summonerName), {
            replace: true,
          })
        }),
      )
    }
  }, [game.participants, navigate, platform, summonerNameFromLocation])

  return basicAsyncRenderer(
    useSWRHttp(apiRoutes.staticData.lang(lang).additional.get, {}, [
      AdditionalStaticData.codec,
      'AdditionalStaticData',
    ]),
  )(additionalStaticData => (
    <ActiveGameComponent
      platform={platform}
      game={game}
      additionalStaticData={additionalStaticData}
    />
  ))
}

type ActiveGameComponentProps = {
  additionalStaticData: AdditionalStaticData
  platform: Platform
  game: ActiveGameView
}

const gridHalfCols = gridTotalCols / 2

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({
  additionalStaticData,
  platform,
  game: { gameStartTime, mapId, gameQueueConfigId, bannedChampions, participants },
}) => {
  const { shouldWrap, onMountLeft, onMountRight } = useShouldWrap()

  const groupedBans = useMemo(
    (): PartialDict<`${TeamId}`, List<Tuple<string, NonEmptyArray<BannedChampion>>>> | null =>
      pipe(
        bannedChampions,
        List.match(
          () => null,
          flow(
            List.groupBy(c => `${c.teamId}`),
            PartialDict.map(teamBans => {
              const grouped = pipe(
                teamBans,
                List.groupByStr(c => `${c.pickTurn}`),
              )
              return pipe(
                pipe(
                  grouped,
                  PartialDict.every(bans => bans.length === 1),
                )
                  ? { 1: teamBans }
                  : grouped,
                DictUtils.entries,
                List.sort(ordByPickTurn),
              )
            }),
          ),
        ),
      ),
    [bannedChampions],
  )

  const groupedParticipants = useMemo(
    (): PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipantView>> =>
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

  const timerRef = useRef<HTMLSpanElement>(null)
  const date = DayJs.toDate(gameStartTime)

  return (
    <div className="grid min-h-full grid-rows-[1fr_auto_auto_1fr] gap-4 py-3">
      <div className="flex items-center justify-center gap-4 px-3">
        <h2 className="text-lg text-goldenrod">{GameQueue.label[gameQueueConfigId]}</h2>
        <span ref={timerRef} className="flex text-grey-400">
          (<pre>{prettyMs(gameDuration)}</pre>)
        </span>
        <Tooltip hoverRef={timerRef}>
          Partie commencée à {date.toLocaleTimeString()} (le {date.toLocaleDateString()})
        </Tooltip>
      </div>

      {groupedBans !== null ? <ActiveGameBans bans={groupedBans} /> : <span />}

      <div className={shouldWrap ? 'flex flex-col gap-1' : cx('grid gap-x-0 gap-y-4', xlGridCols)}>
        {TeamId.values.map((teamId, i) => {
          const reverse = i % 2 === 1
          return (
            <ul
              key={teamId}
              className={
                shouldWrap ? cx('grid gap-y-1', reverse ? gridColsReverse : gridCols) : 'contents'
              }
            >
              {i === 0 ? (
                <span
                  ref={onMountLeft}
                  className="row-start-1"
                  style={{ gridColumn: `1 / ${gridHalfCols + 1}` }}
                />
              ) : null}
              {i === 1 ? (
                <span
                  ref={onMountRight}
                  className="row-start-1"
                  style={{ gridColumn: `${gridHalfCols + 1} / ${gridTotalCols + 1}` }}
                />
              ) : null}
              {groupedParticipants[teamId]?.map((participant, j) => (
                <ActiveGameParticipant
                  key={participant.summonerName}
                  summonerSpells={additionalStaticData.summonerSpells}
                  runeStyles={additionalStaticData.runeStyles}
                  runes={additionalStaticData.runes}
                  platform={platform}
                  mapId={mapId}
                  participant={participant}
                  reverse={reverse}
                  index={j}
                />
              ))}
            </ul>
          )
        })}
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

const ordByPickTurn = pipe(
  number.Ord,
  ord.contramap(
    ([, c]: Tuple<unknown, NonEmptyArray<BannedChampion>>) => NonEmptyArray.head(c).pickTurn,
  ),
)
