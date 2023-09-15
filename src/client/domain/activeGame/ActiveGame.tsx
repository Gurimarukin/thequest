/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import type { Platform } from '../../../shared/models/api/Platform'
import { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import { SummonerActiveGameView } from '../../../shared/models/api/activeGame/SummonerActiveGameView'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChallengesView } from '../../../shared/models/api/challenges/ChallengesView'
import { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import { RuneId } from '../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { List } from '../../../shared/utils/fp'
import { Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import { AsyncRenderer } from '../../components/AsyncRenderer'
import { Challenge } from '../../components/Challenge'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { usePlatformSummonerNameFromLocation } from '../../hooks/usePlatformSummonerNameFromLocation'
import { usePrevious } from '../../hooks/usePrevious'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { RefreshOutline } from '../../imgs/svgs/icons'
import { appRoutes } from '../../router/AppRouter'
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

const { pad10 } = StringUtils

const reloadInterval = MsDuration.seconds(10)
const timerInterval = MsDuration.second(1)

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => {
  const { maybeUser } = useUser()
  const { t } = useTranslation('activeGame')

  const { data, error, mutate } = useSWRHttp(
    apiRoutes.summoner.byName(platform, summonerName).activeGame.get,
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

  const refreshGame = useCallback(() => {
    mutate(undefined, { revalidate: true })
  }, [mutate])

  const reloadGame = useCallback(() => {
    mutate()
  }, [mutate])

  return (
    <MainLayout>
      <AsyncRenderer data={data} error={error}>
        {Maybe.fold(
          () => (
            <div className="flex flex-col items-center gap-4">
              <pre className="mt-4">{t.notInGame}</pre>
              <button type="button" onClick={refreshGame}>
                <RefreshOutline className="w-6" />
              </button>
            </div>
          ),
          summonerGame => (
            <WithoutAdditional
              platform={platform}
              summonerGame={summonerGame}
              refreshGame={refreshGame}
              reloadGame={reloadGame}
            />
          ),
        )}
      </AsyncRenderer>
    </MainLayout>
  )
}

const WithoutAdditional: React.FC<
  Omit<ActiveGameComponentProps, 'additionalStaticData'>
> = props => {
  const { summoner } = props.summonerGame

  const { navigate } = useHistory()
  const { addRecentSearch } = useUser()
  const { lang } = useTranslation()
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

  return (
    <AsyncRenderer
      {...useSWRHttp(apiRoutes.staticData.lang(lang).additional.get, {}, [
        AdditionalStaticData.codec,
        'AdditionalStaticData',
      ])}
    >
      {additionalStaticData => (
        <ActiveGameComponent {...props} additionalStaticData={additionalStaticData} />
      )}
    </AsyncRenderer>
  )
}

type ActiveGameComponentProps = {
  additionalStaticData: AdditionalStaticData
  platform: Platform
  summonerGame: SummonerActiveGameView
  // soft reload: just call swr mutate, but keep already loaded data
  reloadGame: () => void
  // hard refresh: call swr mutate with undefined, provoking visual refresh
  refreshGame: () => void
}

const gridHalfCols = gridTotalCols / 2

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({
  additionalStaticData,
  platform,
  summonerGame: {
    summoner,
    game: { gameStartTime, mapId, gameQueueConfigId, isDraft, participants },
  },
  refreshGame,
  reloadGame,
}) => {
  const { t } = useTranslation('common')

  const { shouldWrap, onMountLeft, onMountRight } = useShouldWrap()

  const summonerSpellByKey = useMemo(
    (): ((key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>) =>
      pipe(
        additionalStaticData.summonerSpells,
        ListUtils.findFirstBy(SummonerSpellKey.Eq)(s => s.key),
      ),
    [additionalStaticData.summonerSpells],
  )

  const runeStyleById = useMemo(
    (): ((id: RuneStyleId) => Maybe<StaticDataRuneStyle>) =>
      pipe(
        additionalStaticData.runeStyles,
        ListUtils.findFirstBy(RuneStyleId.Eq)(s => s.id),
      ),
    [additionalStaticData.runeStyles],
  )

  const runeById = useMemo(
    (): ((id: RuneId) => Maybe<StaticDataRune>) =>
      pipe(
        additionalStaticData.runes,
        ListUtils.findFirstBy(RuneId.Eq)(s => s.id),
      ),
    [additionalStaticData.runes],
  )

  return (
    <div className="grid min-h-full grid-rows-[1fr_auto_auto_auto_1fr] gap-4 py-3">
      <div className="flex items-center justify-center gap-4 px-3">
        <button type="button" onClick={refreshGame}>
          <RefreshOutline className="w-6" />
        </button>
        <h2 className="text-lg text-goldenrod">{t.labels.gameQueue[gameQueueConfigId]}</h2>
        {pipe(
          gameStartTime,
          Maybe.fold(
            () => <Loading reload={reloadGame} />,
            startTime => <Timer startTime={startTime} />,
          ),
        )}
      </div>

      {isDraft ? <ActiveGameBans participants={participants} /> : <span />}

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
                  summonerSpellByKey={summonerSpellByKey}
                  runeStyleById={runeStyleById}
                  runeById={runeById}
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

      <GameChallenges participants={participants} />
    </div>
  )
}

type LoadingProps = {
  reload: () => void
}

const Loading: React.FC<LoadingProps> = ({ reload }) => {
  const { t } = useTranslation('activeGame')

  useEffect(() => {
    const id = window.setInterval(reload, MsDuration.unwrap(reloadInterval))
    return () => window.clearInterval(id)
  }, [reload])

  return <GameInfo>{t.loading}</GameInfo>
}

type TimerProps = {
  startTime: DayJs
}

const Timer: React.FC<TimerProps> = ({ startTime }) => {
  const { t } = useTranslation('activeGame')

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
      <Tooltip hoverRef={timerRef}>{t.gameStartedAt(date)}</Tooltip>
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

type GameChallengesProps = {
  participants: ActiveGameView['participants']
}

const GameChallenges: React.FC<GameChallengesProps> = ({ participants }) => {
  const { t } = useTranslation('common')
  const { championByKey } = useStaticData()

  const factions = useMemo(
    (): PartialDict<`${TeamId}`, List<ChampionFaction>> =>
      pipe(
        participants,
        PartialDict.map(
          flow(
            NonEmptyArray.map(p =>
              pipe(
                championByKey(p.championId),
                Maybe.fold(
                  () => [],
                  c => c.factions,
                ),
              ),
            ),
            ListUtils.commonElems(ChampionFaction.Eq),
          ),
        ),
      ),
    [championByKey, participants],
  )

  return (
    <div className="grid w-full grid-cols-[1fr_1fr] gap-6 px-3 text-sm text-goldenrod">
      {TeamId.values.map((teamId, i) => {
        const reverse = i % 2 === 1
        return (
          <ul key={teamId} className={cx('flex gap-4', ['justify-end', reverse])}>
            {(factions[teamId] ?? []).map(faction => (
              <li
                key={faction}
                className={cx('flex items-center gap-1.5', ['flex-row-reverse', reverse])}
              >
                <Challenge
                  id={ChallengesView.id[faction]}
                  tier={Maybe.some('GOLD')}
                  className="h-9"
                />
                {t.labels.faction[faction]}
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}
