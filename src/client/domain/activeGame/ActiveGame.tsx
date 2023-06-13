/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import { forwardRef, useEffect, useRef, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import type { Platform } from '../../../shared/models/api/Platform'
import { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { GameQueue } from '../../../shared/models/api/activeGame/GameQueue'
import { SummonerActiveGameView } from '../../../shared/models/api/activeGame/SummonerActiveGameView'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

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

const reloadInterval = MsDuration.seconds(10)
const timerInterval = MsDuration.second(1)

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => {
  const { maybeUser } = useUser()

  const { data, error, mutate } = useSWRHttp(
    apiRoutes.summoner.byName(platform, cleanSummonerName(summonerName)).activeGame.get,
    {},
    [Maybe.decoder(SummonerActiveGameView.codec), 'Maybe<SummonerActiveGameView>'],
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
            SummonerActiveGameView.Lens.game.participants,
            lens.modify(
              PartialDict.map(
                NonEmptyArray.map(ActiveGameParticipantView.Lens.shardsCount.set(Maybe.none)),
              ),
            ),
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
          summonerGame => (
            <WithoutAdditional
              platform={platform}
              summonerGame={summonerGame}
              reloadGame={mutate}
            />
          ),
        ),
      )}
    </MainLayout>
  )
}

const WithoutAdditional: React.FC<
  Omit<ActiveGameComponentProps, 'additionalStaticData'>
> = props => {
  const { summoner } = props.summonerGame

  const { navigate } = useHistory()
  const { addRecentSearch } = useUser()
  const { lang } = useStaticData()
  const summonerNameFromLocation = usePlatformSummonerNameFromLocation()?.summonerName

  useEffect(
    () =>
      addRecentSearch({
        platform: props.platform,
        puuid: summoner.puuid,
        name: summoner.name,
        profileIconId: summoner.profileIconId,
      }),
    [addRecentSearch, props.platform, summoner.name, summoner.profileIconId, summoner.puuid],
  )

  // Correct case of summoner's name in url
  useEffect(() => {
    if (summonerNameFromLocation !== summoner.name) {
      navigate(appRoutes.platformSummonerNameGame(props.platform, summoner.name), {
        replace: true,
      })
    }
  }, [navigate, props.platform, summoner.name, summonerNameFromLocation])

  return basicAsyncRenderer(
    useSWRHttp(apiRoutes.staticData.lang(lang).additional.get, {}, [
      AdditionalStaticData.codec,
      'AdditionalStaticData',
    ]),
  )(additionalStaticData => (
    <ActiveGameComponent {...props} additionalStaticData={additionalStaticData} />
  ))
}

type ActiveGameComponentProps = {
  additionalStaticData: AdditionalStaticData
  platform: Platform
  summonerGame: SummonerActiveGameView
  reloadGame: () => void
}

const gridHalfCols = gridTotalCols / 2

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({
  additionalStaticData,
  platform,
  summonerGame: {
    summoner,
    game: { gameStartTime, mapId, gameQueueConfigId, isDraft, participants },
  },
  reloadGame,
}) => {
  const { shouldWrap, onMountLeft, onMountRight } = useShouldWrap()

  return (
    <div
      className={cx(
        'grid min-h-full gap-4 py-3',
        isDraft ? 'grid-rows-[1fr_auto_auto_1fr]' : 'grid-rows-[1fr_auto_1fr]',
      )}
    >
      <div className="flex items-center justify-center gap-4 px-3">
        <h2 className="text-lg text-goldenrod">{GameQueue.label[gameQueueConfigId]}</h2>
        {pipe(
          gameStartTime,
          Maybe.fold(
            () => <Loading reload={reloadGame} />,
            startTime => <Timer startTime={startTime} />,
          ),
        )}
      </div>

      {isDraft ? <ActiveGameBans participants={participants} /> : null}

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
              {participants[teamId]?.map((participant, j) => (
                <ActiveGameParticipant
                  key={participant.summonerName}
                  summonerSpells={additionalStaticData.summonerSpells}
                  runeStyles={additionalStaticData.runeStyles}
                  runes={additionalStaticData.runes}
                  platform={platform}
                  mapId={mapId}
                  teamId={teamId}
                  participant={participant}
                  highlight={participant.summonerName === summoner.name}
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

type LoadingProps = {
  reload: () => void
}

const Loading: React.FC<LoadingProps> = ({ reload }) => {
  useEffect(() => {
    const id = window.setInterval(reload, MsDuration.unwrap(reloadInterval))
    return () => window.clearInterval(id)
  }, [reload])

  return <GameInfo>chargement</GameInfo>
}

type TimerProps = {
  startTime: DayJs
}

const Timer: React.FC<TimerProps> = ({ startTime }) => {
  const [gameDuration, setGameDuration] = useState(() => pipe(DayJs.now(), DayJs.diff(startTime)))

  useEffect(() => {
    const id = window.setInterval(
      () => setGameDuration(MsDuration.add(timerInterval)),
      MsDuration.unwrap(timerInterval),
    )
    return () => window.clearInterval(id)
  }, [])

  const timerRef = useRef<HTMLSpanElement>(null)
  const date = DayJs.toDate(startTime)

  return (
    <>
      <GameInfo ref={timerRef}>
        <pre>{prettyMs(gameDuration)}</pre>
      </GameInfo>
      <Tooltip hoverRef={timerRef}>
        Partie commencée à {date.toLocaleTimeString()} ({date.toLocaleDateString()})
      </Tooltip>
    </>
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

type GameInfoProps = {
  children: React.ReactNode
}

const GameInfo = forwardRef<HTMLSpanElement, GameInfoProps>(({ children }, ref) => (
  <span ref={ref} className="flex text-grey-400">
    ({children})
  </span>
))
