/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useSprings } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import { Business } from '../../../shared/Business'
import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import type { GameMode } from '../../../shared/models/api/GameMode'
import type { Lang } from '../../../shared/models/api/Lang'
import { MapId } from '../../../shared/models/api/MapId'
import { Platform } from '../../../shared/models/api/Platform'
import { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import { SummonerActiveGameView } from '../../../shared/models/api/activeGame/SummonerActiveGameView'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { RuneId } from '../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticDataRune } from '../../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataRuneStyle } from '../../../shared/models/api/staticData/StaticDataRuneStyle'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import type { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { Dict, List } from '../../../shared/utils/fp'
import { Maybe, NonEmptyArray, PartialDict } from '../../../shared/utils/fp'

import { AsyncRenderer } from '../../components/AsyncRenderer'
import { Pre } from '../../components/Pre'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { config } from '../../config/unsafe'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { useOnSearchSummoner } from '../../hooks/useOnSearchSummoner'
import { usePrevious } from '../../hooks/usePrevious'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { Assets } from '../../imgs/Assets'
import { CheckMarkSharp, CloseFilled, RefreshOutline } from '../../imgs/svgs/icons'
import { appRoutes } from '../../router/AppRouter'
import { cx } from '../../utils/cx'
import { ActiveGameHeader } from './ActiveGameHeader'
import { ActiveGameParticipant, gridCols } from './ActiveGameParticipant'
import {
  ActiveGamePositions,
  participantHeightDesktop,
  participantHeightMobile,
} from './ActiveGamePositions'
import { useActiveGame } from './useActiveGame'
import { useShouldWrap } from './useShouldWrap'

const { swap } = ListUtils
const { clamp } = NumberUtils
const { pad10 } = StringUtils

const refreshDelay = MsDuration.milliseconds(100)
const reloadInterval = MsDuration.seconds(10)
const timerInterval = MsDuration.second(1)

type Props = {
  platform: Platform
  riotId: RiotId
}

export const ActiveGame: React.FC<Props> = ({ platform, riotId }) => {
  const { maybeUser } = useUser()
  const { lang } = useTranslation()

  const { data, error, mutate } = useActiveGame(lang, platform, riotId)

  // Remove shards on user disconnect
  const previousUser = usePrevious(maybeUser)
  useEffect(() => {
    if (
      data !== undefined &&
      Maybe.isNone(maybeUser) &&
      Maybe.isSome(Maybe.flatten(previousUser)) &&
      Maybe.isSome(data.game)
    ) {
      void mutate(
        pipe(
          SummonerActiveGameView.Lens.game.participants,
          optional.modify(
            PartialDict.map(
              NonEmptyArray.map(ActiveGameParticipantView.Lens.shardsCount.set(Maybe.none)),
            ),
          ),
        )(data),
        { revalidate: false },
      )
    }
  }, [data, maybeUser, mutate, previousUser])

  const refreshGame = useCallback(() => {
    void mutate(undefined, { revalidate: false })
    setTimeout(() => mutate(undefined, { revalidate: true }), MsDuration.unwrap(refreshDelay))
  }, [mutate])

  const reloadGame = useCallback(() => {
    void mutate()
  }, [mutate])

  return (
    <MainLayout>
      <AsyncRenderer data={data} error={error}>
        {summonerGame => (
          <Loaded
            platform={platform}
            summoner={summonerGame.summoner}
            game={summonerGame.game}
            refreshGame={refreshGame}
            reloadGame={reloadGame}
          />
        )}
      </AsyncRenderer>
    </MainLayout>
  )
}

const Loaded: React.FC<
  Omit<ActiveGameComponentProps, 'additionalStaticData' | 'game'> & {
    game: Maybe<ActiveGameView>
  }
> = props => {
  const { summoner, refreshGame } = props

  const { t } = useTranslation('activeGame')

  useOnSearchSummoner(summoner, appRoutes.platformRiotIdGame(props.platform, summoner.riotId))

  return pipe(
    props.game,
    Maybe.fold(
      () => (
        <div className="flex flex-col items-center gap-4">
          <Pre className="mt-4">{t.notInGame}</Pre>
          <button type="button" onClick={refreshGame}>
            <RefreshOutline className="w-6" />
          </button>
        </div>
      ),
      game => <WithoutAdditional {...props} game={game} />,
    ),
  )
}

const WithoutAdditional: React.FC<
  Omit<ActiveGameComponentProps, 'additionalStaticData' | 'game'> & {
    game: ActiveGameView
  }
> = props => {
  const { lang } = useTranslation()

  return (
    <AsyncRenderer
      {...useSWRHttp(apiRoutes.staticData(lang).additional.get, {}, [
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
  summoner: SummonerShort
  game: ActiveGameView
  // soft reload: just call swr mutate, but keep already loaded data
  reloadGame: () => void
  // hard refresh: call swr mutate with undefined, provoking visual refresh
  refreshGame: () => void
}

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({
  additionalStaticData,
  platform,
  summoner,
  game: {
    gameStartTime,
    mapId,
    gameMode,
    gameQueueConfigId,
    isDraft,
    bannedChampions,
    participants,
    isPoroOK,
  },
  refreshGame,
  reloadGame,
}) => {
  const { lang, t } = useTranslation()

  const { shouldWrap, onMountContainer, onMountLeft, onMountRight } = useShouldWrap()

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

  const shouldShowPositions = MapId.isSummonersRift(mapId)

  return (
    <div className="grid min-h-full grid-rows-[1fr_auto_auto_1fr] gap-4 py-3">
      <div className="flex items-center justify-center gap-4 px-3">
        <button type="button" onClick={refreshGame}>
          <RefreshOutline className="w-6" />
        </button>
        <h2 className="text-xl font-bold text-goldenrod">
          {t.common.labels.gameQueue[gameQueueConfigId]}
        </h2>
        {pipe(
          gameStartTime,
          Maybe.fold(
            () => <Loading reload={reloadGame} />,
            startTime => <Timer startTime={startTime} />,
          ),
        )}

        <div className="flex items-center gap-0.5">
          <a href={poroLink(lang, platform, summoner.riotId)} target="_blank" rel="noreferrer">
            <img src={Assets.poro} alt={t.activeGame.poroIconAlt} className="h-5" />
          </a>
          {isPoroOK ? (
            <CheckMarkSharp className="w-3 text-green" />
          ) : (
            <CloseFilled className="w-3 text-red" />
          )}
        </div>
      </div>

      <ActiveGameHeader
        isDraft={isDraft}
        bannedChampions={bannedChampions}
        participants={participants}
      />

      <div
        ref={onMountContainer}
        className={shouldWrap ? 'flex flex-col items-start gap-1' : 'grid grid-cols-2'}
      >
        {TeamId.values.map((teamId, i) => {
          const reverse = i % 2 === 1
          const participants_ = participants[teamId]
          const mountRef = i === 0 ? onMountLeft : i === 1 ? onMountRight : undefined
          return (
            <ul
              key={teamId}
              className={cx('grid', ['self-end', shouldWrap && reverse])}
              style={{
                ...(shouldShowPositions && !shouldWrap
                  ? {
                      gridRowStart: Math.floor((i + 2) / 2),
                      gridRowEnd: `span ${participants_?.length ?? 0}`,
                    }
                  : {}),
                gridColumnStart: reverse ? 2 : 1,
                ...gridCols[`${reverse}`],
              }}
            >
              {mountRef !== undefined ? (
                <li ref={mountRef} className="col-span-full row-start-1" />
              ) : null}

              {shouldShowPositions && shouldWrap ? (
                <ActiveGamePositions
                  shouldWrap={shouldWrap}
                  rowMultiple={3}
                  iconClassName={cx(
                    'col-span-full col-start-1 pt-[39px]',
                    reverse ? 'justify-self-start -ml-2.5' : 'justify-self-end -mr-2.5',
                  )}
                />
              ) : null}

              {participants_ === undefined ? null : (
                <Participants
                  platform={platform}
                  summoner={summoner}
                  gameMode={gameMode}
                  shouldWrap={shouldWrap}
                  teamId={teamId}
                  reverse={reverse}
                  participants={participants_}
                  summonerSpellByKey={summonerSpellByKey}
                  runeStyleById={runeStyleById}
                  runeById={runeById}
                />
              )}
            </ul>
          )
        })}

        {shouldShowPositions && !shouldWrap ? (
          <ActiveGamePositions
            shouldWrap={shouldWrap}
            iconClassName="col-span-2 justify-self-center col-start-1 pt-[39px]"
          />
        ) : null}
      </div>
    </div>
  )
}

const poroLink = (lang: Lang, platform: Platform, { gameName, tagLine }: RiotId): string =>
  `${config.poroApiBaseUrl}/${Business.poroLang[lang]}/live/${Platform.encoderLower.encode(
    platform,
  )}/${gameName}-${tagLine}/ranked-only/season`

type ParticipantsProps = {
  platform: Platform
  summoner: SummonerShort
  gameMode: GameMode
  shouldWrap: boolean
  teamId: TeamId
  reverse: boolean
  participants: List<ActiveGameParticipantView>
  summonerSpellByKey: (key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>
  runeStyleById: (id: RuneStyleId) => Maybe<StaticDataRuneStyle>
  runeById: (id: RuneId) => Maybe<StaticDataRune>
}

const Participants: React.FC<ParticipantsProps> = ({
  platform,
  summoner,
  gameMode,
  shouldWrap,
  teamId,
  reverse,
  participants,
  summonerSpellByKey,
  runeStyleById,
  runeById,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const order = useRef<List<number>>(participants.map((_, index) => index)) // Store indicies as a local ref, this represents the item order

  const participantHeight = shouldWrap ? participantHeightMobile : participantHeightDesktop

  const [springs, api] = useSprings(
    participants.length,
    fn(participantHeight, teamId, order.current),
  ) // Create springs, each corresponds to an item, controlling its transform, etc.

  const bind = useDrag(({ event, args: [activeIndex], active, movement: [, y] }) => {
    event.preventDefault()

    setIsDragging(active)

    const currentIndex = order.current.indexOf(activeIndex)
    const currentRow = clamp(
      Math.round((currentIndex * participantHeight + y) / participantHeight),
      0,
      participants.length - 1,
    )

    if (active) {
      void api.start(
        fn(
          participantHeight,
          teamId,
          order.current,
          active,
          activeIndex,
          currentIndex,
          currentRow,
          y,
        ),
      ) // Feed springs new style data, they'll animate the view without causing a single render
    } else {
      const newOrder = swap(order.current, currentIndex, currentRow)
      void api.start(
        fn(participantHeight, teamId, newOrder, active, activeIndex, currentIndex, currentRow, y),
      )

      // eslint-disable-next-line functional/immutable-data
      order.current = newOrder
    }
  })

  return (
    <>
      {springs.map((springStyle, j) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const participant = participants[j]!
        return (
          <ActiveGameParticipant
            key={RiotId.stringify(participant.riotId)}
            summonerSpellByKey={summonerSpellByKey}
            runeStyleById={runeStyleById}
            runeById={runeById}
            platform={platform}
            gameMode={gameMode}
            participant={participant}
            shouldWrap={shouldWrap}
            highlight={RiotId.Eq.equals(participant.riotId, summoner.riotId)}
            reverse={reverse}
            index={j}
            isLast={j === springs.length - 1}
            isDragging={isDragging}
            springStyle={springStyle}
            gestureProps={bind(j)}
          />
        )
      })}
    </>
  )
}

const dragOffset = 20

const fn =
  (
    participantHeight: number,
    teamId: TeamId,
    order: List<number>,
    active = false,
    originalIndex = 0,
    currentIndex = 0,
    currentRow = 0,
    y = 0,
  ) =>
  (index: number) => {
    if (active && index === originalIndex) {
      return {
        x: teamId === 100 ? dragOffset : -dragOffset,
        y: (currentIndex - originalIndex) * participantHeight + y,
        color: dragColor[teamId],
        zIndex: 2,
        immediate: (key: string) => key === 'y' || key === 'zIndex',
      }
    }
    const indexOf = order.indexOf(index)
    return {
      x: 0,
      y: (indexOf - index) * participantHeight,
      color: active && indexOf === currentRow ? dragOverColor : baseColor[teamId],
      zIndex: 1,
      immediate: false,
    }
  }

const baseColor: Dict<`${TeamId}`, string> = {
  100: '#061b3e',
  200: '#261622',
}

const dragColor: Dict<`${TeamId}`, string> = {
  100: '#04285c',
  200: '#411a21',
}

const dragOverColor = '#525252'

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
        <span className="font-lib-mono">{prettyMs(gameDuration)}</span>
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
