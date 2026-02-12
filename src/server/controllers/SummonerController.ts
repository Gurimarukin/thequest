import { apply, monoid, number, ord, separated, task } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { Business } from '../../shared/Business'
import type { DayJs } from '../../shared/models/DayJs'
import { ValidatedSoft } from '../../shared/models/ValidatedSoft'
import type { Lang } from '../../shared/models/api/Lang'
import { MapId } from '../../shared/models/api/MapId'
import type { Platform } from '../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameMasteriesView } from '../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../shared/models/api/activeGame/ActiveGameView'
import { SummonerActiveGameView } from '../../shared/models/api/activeGame/SummonerActiveGameView'
import type { TeamId } from '../../shared/models/api/activeGame/TeamId'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { ChampionShardsView } from '../../shared/models/api/summoner/ChampionShardsView'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import { RiotId } from '../../shared/models/riot/RiotId'
import { Sink } from '../../shared/models/rx/Sink'
import { ListUtils } from '../../shared/utils/ListUtils'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import {
  Either,
  Future,
  List,
  Maybe,
  NonEmptyArray,
  PartialDict,
  Try,
  Tuple,
} from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { ActiveGame } from '../models/activeGame/ActiveGame'
import type { ActiveGameParticipantVisible } from '../models/activeGame/ActiveGameParticipant'
import { ActiveGameParticipant } from '../models/activeGame/ActiveGameParticipant'
import type { PoroActiveGame } from '../models/activeGame/PoroActiveGame'
import type { PoroActiveGameParticipant } from '../models/activeGame/PoroActiveGameParticipant'
import { PoroActiveGameParticipantVisible } from '../models/activeGame/PoroActiveGameParticipant'
import { LeagueEntry } from '../models/league/LeagueEntry'
import { Leagues } from '../models/league/Leagues'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { Summoner, SummonerWithRiotId } from '../models/summoner/Summoner'
import type { TokenContent } from '../models/user/TokenContent'
import type { WikiChampionData } from '../models/wiki/WikiChampionData'
import { WikiChampionPosition } from '../models/wiki/WikiChampionPosition'
import type { ActiveGameService } from '../services/ActiveGameService'
import type { ChallengesService } from '../services/ChallengesService'
import type { LeagueEntryService } from '../services/LeagueEntryService'
import type { MasteriesService } from '../services/MasteriesService'
import type { PoroActiveGameService } from '../services/PoroActiveGameService'
import type { RiotAccountService } from '../services/RiotAccountService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
import type { StaticDataService } from '../services/staticDataService/StaticDataService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'
import { validateSoftEncoder } from '../webServer/utils/permissions'

const queueTypes = {
  soloDuo: 'RANKED_SOLO_5x5',
  flex: 'RANKED_FLEX_SR',
}

type SummonerController = ReturnType<typeof SummonerController>

const SummonerController = (
  Logger: LoggerGetter,
  activeGameService: ActiveGameService,
  challengesService: ChallengesService,
  leagueEntryService: LeagueEntryService,
  masteriesService: MasteriesService,
  poroActiveGameService: PoroActiveGameService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
  staticDataService: StaticDataService,
  userService: UserService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const logger = Logger('SummonerController')

  return {
    summonerShortByPuuid: (platform: Platform, puuid: Puuid): EndedMiddleware =>
      pipe(
        apply.sequenceT(futureMaybe.ApplyPar)(
          summonerService.findByPuuid(platform, puuid),
          riotAccountService.findByPuuid(puuid),
        ),
        futureMaybe.map(([summoner, { riotId }]): SummonerShort => ({ ...summoner, riotId })),
        M.fromTaskEither,
        M.ichain(
          Maybe.fold(
            () => M.sendWithStatus(Status.NotFound)('Summoner not found'),
            M.json(SummonerShort.codec),
          ),
        ),
      ),

    summonerShortByRiotId: (platform: Platform, riotId_: RiotId): EndedMiddleware =>
      pipe(
        riotAccountService.findByRiotId(riotId_),
        futureMaybe.chain(({ riotId, puuid }) =>
          pipe(
            summonerService.findByPuuid(platform, puuid),
            futureMaybe.map((s): SummonerShort => ({ ...s, riotId })),
          ),
        ),
        M.fromTaskEither,
        M.ichain(
          Maybe.fold(
            () => M.sendWithStatus(Status.NotFound)('Summoner not found'),
            M.json(SummonerShort.codec),
          ),
        ),
      ),

    masteriesByPuuid:
      (platform: Platform, puuid: Puuid) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          apply.sequenceT(futureMaybe.ApplyPar)(
            summonerService.findByPuuid(platform, puuid),
            riotAccountService.findByPuuid(puuid),
          ),
          futureMaybe.map(([summoner, account]) => ({ ...summoner, riotId: account.riotId })),
          findMasteries(platform, maybeUser),
        ),

    masteriesByRiotId:
      (platform: Platform, riotId_: RiotId) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          riotAccountService.findByRiotId(riotId_),
          futureMaybe.bind('summoner', ({ puuid }) => summonerService.findByPuuid(platform, puuid)),
          futureMaybe.map(({ riotId, summoner }) => ({ ...summoner, riotId })),
          findMasteries(platform, maybeUser),
        ),

    challengesByPuuid: (platform: Platform, puuid: Puuid): EndedMiddleware =>
      pipe(
        summonerService.findByPuuid(platform, puuid),
        Future.map(Either.fromOption(() => 'Summoner not found')),
        futureEither.chain(summoner =>
          pipe(
            challengesService.findBySummoner(summoner.platform, summoner.puuid),
            Future.map(Either.fromOption(() => 'Challenges not found')),
          ),
        ),
        M.fromTaskEither,
        M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(ChallengesView.codec))),
      ),

    activeGameByPuuid:
      (lang: Lang, platform: Platform, puuid: Puuid) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          apply.sequenceT(futureMaybe.ApplyPar)(
            summonerService.findByPuuid(platform, puuid),
            riotAccountService.findByPuuid(puuid),
          ),
          futureMaybe.map(([summoner, { riotId }]) => ({ ...summoner, riotId })),
          findActiveGame(lang, maybeUser),
        ),

    activeGameByRiotId:
      (lang: Lang, platform: Platform, riotId_: RiotId) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          riotAccountService.findByRiotId(riotId_),
          futureMaybe.bind('summoner', ({ puuid }) => summonerService.findByPuuid(platform, puuid)),
          futureMaybe.map(({ riotId, summoner }) => ({ ...summoner, riotId })),
          findActiveGame(lang, maybeUser),
        ),
  }

  function findMasteries(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
  ): (summoner: Future<Maybe<SummonerWithRiotId>>) => EndedMiddleware {
    return flow(
      Future.map(Either.fromOption(() => 'Summoner not found')),
      futureEither.bindTo('summoner'),
      futureEither.bind('leagues', ({ summoner }) =>
        pipe(
          findLeagues(platform, summoner.puuid),
          Future.map(Either.fromOption(() => 'Leagues not found')),
        ),
      ),
      futureEither.bind('masteries', ({ summoner }) =>
        pipe(
          masteriesService.findBySummoner(platform, summoner.puuid),
          Future.map(Either.fromOption(() => 'Masteries not found')),
        ),
      ),
      futureEither.bind('championShards', ({ summoner }) =>
        pipe(
          futureMaybe.fromOption(maybeUser),
          futureMaybe.chainTaskEitherK(user => findChampionShards(user, summoner)),
          Future.map(Either.right),
        ),
      ),
      M.fromTaskEither,
      M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(SummonerMasteriesView.codec))),
    )
  }

  function findLeagues(
    platform: Platform,
    puuid: Puuid,
    options?: { overrideInsertedAfter: DayJs },
  ): Future<Maybe<SummonerLeaguesView>> {
    return pipe(
      leagueEntryService.findBySummoner(platform, puuid, options),
      futureMaybe.map(
        (entries): Leagues => ({
          soloDuo: pipe(
            entries,
            List.findFirst(LeagueEntry.isRankedAndQueueTypeEquals(queueTypes.soloDuo)),
          ),
          flex: pipe(
            entries,
            List.findFirst(LeagueEntry.isRankedAndQueueTypeEquals(queueTypes.flex)),
          ),
        }),
      ),
      futureMaybe.map(Leagues.toView),
    )
  }

  function findChampionShards(
    user: TokenContent,
    summoner: Summoner,
  ): Future<List<ChampionShardsView>> {
    return pipe(
      userService.listChampionShardsForSummoner(user.id, summoner.puuid),
      Sink.readonlyArray,
    )
  }

  function findActiveGame(
    lang: Lang,
    maybeUser: Maybe<TokenContent>,
  ): (summoner: Future<Maybe<SummonerWithRiotId>>) => EndedMiddleware {
    return flow(
      Future.map(Either.fromOption(() => 'Summoner not found')),
      futureEither.chainTaskEitherK(summoner =>
        pipe(
          activeGame(lang, summoner, maybeUser),
          Future.map(
            Maybe.fold(
              () => ValidatedSoft<SummonerActiveGameView>({ summoner, game: Maybe.none }),
              ValidatedSoft.map(
                (game): SummonerActiveGameView => ({ summoner, game: Maybe.some(game) }),
              ),
            ),
          ),
        ),
      ),
      M.fromTaskEither,
      M.ichain(
        Either.fold(
          M.sendWithStatus(Status.NotFound),
          M.json(validateSoftEncoder(maybeUser, SummonerActiveGameView.codec)),
        ),
      ),
    )
  }

  function activeGame(
    lang: Lang,
    summoner: SummonerWithRiotId,
    maybeUser: Maybe<TokenContent>,
  ): Future<Maybe<ValidatedSoft<ActiveGameView, string>>> {
    return pipe(
      activeGameService.findBySummoner(summoner.platform, summoner.puuid),
      futureMaybe.chainTaskEitherK(game =>
        pipe(
          poroActiveGameService.find(lang, game.gameId, summoner.platform, summoner.riotId),
          task.chain(
            Try.fold(
              e => {
                const msg = 'Error while fetching Poro game (falling back to Riot API only):'

                return pipe(
                  logger.warn(msg, e),
                  Future.fromIOEither,
                  Future.chain(() => activeGameRiot(summoner.platform, maybeUser, game)),
                  Future.map(g => ValidatedSoft(g, `${msg} ${e.name} ${e.message}`)),
                )
              },
              Maybe.fold(
                () => {
                  const msg =
                    'Poro game not found while Riot API returned one (falling back to Riot API only)'

                  return pipe(
                    logger.warn(msg),
                    Future.fromIOEither,
                    Future.chain(() => activeGameRiot(summoner.platform, maybeUser, game)),
                    Future.map(g => ValidatedSoft(g, msg)),
                  )
                },
                flow(
                  activeGamePoro(summoner.platform, maybeUser, game),
                  Future.map(g => ValidatedSoft(g)),
                ),
              ),
            ),
          ),
        ),
      ),
    )
  }

  function activeGameRiot(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    game: ActiveGame,
  ): Future<ActiveGameView> {
    return pipe(
      apply.sequenceS(Future.ApplyPar)({
        champions: staticDataService.wikiChampions,
        participants: pipe(
          game.participants,
          PartialDict.traverse(Future.ApplicativePar)(
            NonEmptyArray.traverse(Future.ApplicativePar)(participant =>
              participant.puuid === null
                ? // streamer mode
                  Future.successful<ActiveGameParticipantView>(
                    ActiveGameParticipant.toView(participant, Maybe.none, Maybe.none, Maybe.none),
                  )
                : enrichParticipantRiot(platform, maybeUser, game.insertedAt, participant),
            ),
          ),
        ),
      }),
      Future.map(({ champions, participants }) =>
        pipe(
          participants,
          PartialDict.map(sortParticipants(champions)(game.mapId)),
          (sorted): ActiveGameView => pipe(game, ActiveGame.toView(sorted, false)),
        ),
      ),
    )
  }

  function enrichParticipantRiot(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    gameInsertedAt: DayJs,
    participant: ActiveGameParticipantVisible,
  ): Future<ActiveGameParticipantView> {
    return pipe(
      apply.sequenceS(Future.ApplyPar)({
        leagues: findLeagues(platform, participant.puuid, {
          overrideInsertedAfter: gameInsertedAt,
        }),
        masteriesAndShardsCount: findMasteriesAndShardsCount(
          platform,
          maybeUser,
          gameInsertedAt,
          participant.puuid,
          participant.championId,
        ),
      }),
      Future.map(({ leagues, masteriesAndShardsCount: { masteries, shardsCount } }) =>
        ActiveGameParticipant.toView(participant, leagues, masteries, shardsCount),
      ),
    )
  }

  type ParticipantViewWithIndex = ActiveGameParticipantView & { index: number }

  function activeGamePoro(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    game: ActiveGame,
  ): (poroGame: PoroActiveGame) => Future<ActiveGameView> {
    return poroGame =>
      pipe(
        game.participants,
        PartialDict.traverse(Future.ApplicativePar)(
          NonEmptyArray.traverse(Future.ApplicativePar)(participant =>
            participant.puuid === null
              ? enrichParticipantPoroStreamer(poroGame.participants, participant)
              : enrichParticipantPoroVisible(
                  platform,
                  maybeUser,
                  game.insertedAt,
                  poroGame.participants,
                  participant,
                ),
          ),
        ),
        Future.map(
          (
            participants: PartialDict<`${TeamId}`, NonEmptyArray<ParticipantViewWithIndex>>,
          ): ActiveGameView => ({
            gameStartTime: game.gameStartTime,
            mapId: game.mapId,
            gameMode: game.gameMode,
            gameQueueConfigId: game.gameQueueConfigId,
            isDraft: game.isDraft,
            bannedChampions: game.bannedChampions,
            participants: pipe(participants, PartialDict.map(NonEmptyArray.sort(ordByIndex))),
            isPoroOK: true,
          }),
        ),
      )
  }

  function enrichParticipantPoroStreamer(
    poroParticipants: List<PoroActiveGameParticipant>,
    participant: ActiveGameParticipant,
  ): Future<ParticipantViewWithIndex> {
    const maybePoroParticipant = pipe(
      poroParticipants,
      List.findFirstMap(p =>
        Either.isLeft(p) && ChampionKey.Eq.equals(p.left.championId, participant.championId)
          ? Maybe.some(p.left)
          : Maybe.none,
      ),
    )

    if (!Maybe.isSome(maybePoroParticipant)) {
      return couldntFindPoroParticipantError(participant.championId)
    }

    const poroParticipant = maybePoroParticipant.value

    return Future.successful<ParticipantViewWithIndex>({
      ...ActiveGameParticipant.toView(participant, Maybe.none, Maybe.none, Maybe.none),
      index: poroParticipant.index,
    })
  }

  function couldntFindPoroParticipantError(key: ChampionKey | string): Future<never> {
    return Future.failed(
      Error(`Riot API participant: couldn't find matching Poro participant: ${key}`),
    )
  }

  function enrichParticipantPoroVisible(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    gameInsertedAt: DayJs,
    poroParticipants: List<PoroActiveGameParticipant>,
    participant: ActiveGameParticipantVisible,
  ): Future<ParticipantViewWithIndex> {
    const riotId = RiotId.trim(participant.riotId)
    const maybePoroParticipant = pipe(
      poroParticipants,
      List.findFirstMap(p =>
        Either.isRight(p) && RiotId.Eq.equals(p.right.riotId, riotId)
          ? Maybe.some(p.right)
          : Maybe.none,
      ),
    )

    if (!Maybe.isSome(maybePoroParticipant)) {
      return couldntFindPoroParticipantError(RiotId.stringify(riotId))
    }

    const poroParticipant = maybePoroParticipant.value

    return pipe(
      findMasteriesAndShardsCount(
        platform,
        maybeUser,
        gameInsertedAt,
        participant.puuid,
        participant.championId,
      ),
      Future.map(
        ({ masteries, shardsCount }): ParticipantViewWithIndex => ({
          ...PoroActiveGameParticipantVisible.toView(
            poroParticipant,
            participant,
            masteries,
            shardsCount,
          ),
          index: poroParticipant.index,
        }),
      ),
    )
  }

  function findMasteriesAndShardsCount(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    gameInsertedAt: DayJs,
    participantPuuid: Puuid,
    participantChampionId: ChampionKey,
  ): Future<{
    masteries: Maybe<ActiveGameMasteriesView>
    shardsCount: Maybe<number>
  }> {
    return apply.sequenceS(Future.ApplyPar)({
      masteries: pipe(
        masteriesService.findBySummoner(platform, participantPuuid, {
          overrideInsertedAfter: gameInsertedAt,
        }),
        futureMaybe.map(({ champions }): ActiveGameMasteriesView => {
          const totalMasteryPoints = pipe(
            champions,
            List.map(c => c.championPoints),
            monoid.concatAll(number.MonoidSum),
          )
          return {
            questPercents: pipe(
              champions,
              List.map(Business.championPercents),
              NumberUtils.average,
            ),
            totalMasteryLevel: pipe(
              champions,
              List.map(m => m.championLevel),
              monoid.concatAll(number.MonoidSum),
            ),
            totalMasteryPoints,
            otpIndex: Business.otpRatio(champions, totalMasteryPoints),
            champion: pipe(
              pipe(
                champions,
                ListUtils.findFirstBy(ChampionKey.Eq)(m => m.championId),
              )(participantChampionId),
              Maybe.map(
                (m): ActiveGameChampionMasteryView => ({
                  championLevel: m.championLevel,
                  championPoints: m.championPoints,
                  championPointsSinceLastLevel: m.championPointsSinceLastLevel,
                  championPointsUntilNextLevel: m.championPointsUntilNextLevel,
                  tokensEarned: m.tokensEarned,
                  markRequiredForNextLevel: m.markRequiredForNextLevel,
                }),
              ),
            ),
          }
        }),
      ),
      shardsCount: pipe(
        Future.successful(maybeUser),
        futureMaybe.chain(user =>
          userService.findChampionShardsForChampion(
            user.id,
            participantPuuid,
            participantChampionId,
          ),
        ),
        futureMaybe.map(s => s.count),
      ),
    })
  }
}

export { SummonerController }

/**
 * @deprecated shards
 *
 * @returns shards to remove, if some
 */
export const shouldNotifyChampionLeveledUp =
  (shardsCount: number) =>
  (oldLevel: number) =>
  (newLevel: number): Try<Maybe<number>> => {
    if (newLevel < oldLevel) {
      return Try.failure(
        Error(
          `shouldNotifyChampionLeveledUp: oldLevel (${oldLevel}) should be equal to or lower than newLevel ${newLevel}`,
        ),
      )
    }

    const diff = Math.min(shardsCount, newLevel - Math.max(oldLevel, 5))

    return Try.success(diff <= 0 ? Maybe.none : Maybe.some(diff))
  }

/**
 * Try to sort participants by positions
 */
const sortParticipants =
  (champions: List<WikiChampionData>) =>
  (mapId: number) =>
  (
    participants: NonEmptyArray<ActiveGameParticipantView>,
  ): NonEmptyArray<ActiveGameParticipantView> => {
    if (!MapId.isSummonersRift(mapId)) return participants

    return sortTeamParticipants(champions)(participants)
  }

type ParticipantWithChampion = Tuple<ActiveGameParticipantView, WikiChampionData>
type Positions = PartialDict<ChampionPosition, ActiveGameParticipantView>

const sortTeamParticipants =
  (champions: List<WikiChampionData>) =>
  (
    participants: NonEmptyArray<ActiveGameParticipantView>,
  ): NonEmptyArray<ActiveGameParticipantView> => {
    const championByKey = pipe(
      champions,
      ListUtils.findFirstBy(ChampionKey.Eq)(c => c.id),
    )

    // we won't be able to do much without associated wiki positions
    const { left: championNotFound, right: championFound } = pipe(
      participants,
      List.partitionMap(p =>
        pipe(
          championByKey(p.championId),
          Maybe.map(c => Tuple.of(p, c)),
          Either.fromOption(() => p),
        ),
      ),
      separated.map(List.sort(ordByPositionCount)),
    )

    // first, handle smite for the jungler
    const { left: withoutSmite, right: withSmite } = pipe(
      championFound,
      List.partition(
        ([p]) => SummonerSpellKey.isSmite(p.spell1Id) || SummonerSpellKey.isSmite(p.spell2Id),
      ),
    )

    const [jun, ...withSmiteNotJungle] = withSmite
    const accWithJun: Positions = { jun: jun?.[0] }

    const [positions, remain1] = pipe(
      ChampionPosition.values,
      List.reduce(
        Tuple.of<[Positions, List<ParticipantWithChampion>]>(
          accWithJun,
          pipe(withoutSmite, List.concat(withSmiteNotJungle), List.sort(ordByPositionCount)),
        ),
        ([acc, remain], position) => {
          if (acc[position] !== undefined) return Tuple.of(acc, remain)

          const { left: doesntMatchPosition, right: matchesPosition } = pipe(
            remain,
            List.partition(([, c]) =>
              pipe(
                c.external_positions,
                Maybe.exists(
                  List.some(p =>
                    ChampionPosition.Eq.equals(WikiChampionPosition.position[p], position),
                  ),
                ),
              ),
            ),
            separated.map(List.sort(ordByPositionCount)),
          )

          const [maybeForPosition, ...tail] = matchesPosition
          const forPosition: ActiveGameParticipantView | undefined = maybeForPosition?.[0]

          return Tuple.of<[Positions, List<ParticipantWithChampion>]>(
            { ...acc, [position]: forPosition },
            pipe(doesntMatchPosition, List.concat(tail), List.sort(ordByPositionCount)),
          )
        },
      ),
    )

    const [res, remain2] = pipe(
      ChampionPosition.values,
      List.reduce(
        Tuple.of<[List<ActiveGameParticipantView>, List<ActiveGameParticipantView>]>(
          [],
          pipe(championNotFound, List.concat(pipe(remain1, List.map(Tuple.fst)))),
        ),
        ([acc, remain], pos) => {
          const position = positions[pos]
          if (position !== undefined) return Tuple.of(pipe(acc, List.append(position)), remain)

          const [remainHead, ...remainTail] = remain
          return Tuple.of(
            remainHead !== undefined ? pipe(acc, List.append(remainHead)) : acc,
            remainTail,
          )
        },
      ),
    )
    return pipe(res, List.concat(remain2)) as NonEmptyArray<ActiveGameParticipantView>
  }

const hasOnePosition: Predicate<ParticipantWithChampion> = ([, c]) =>
  pipe(
    c.external_positions,
    Maybe.exists(p => p.length === 1),
  )

// sort champions who have only one position before others
const ordByPositionCount: Ord<ParticipantWithChampion> = pipe(
  number.Ord,
  ord.contramap((p: ParticipantWithChampion) => (hasOnePosition(p) ? 1 : 2)),
)

const ordByIndex: Ord<{ readonly index: number }> = pipe(
  number.Ord,
  ord.contramap(a => a.index),
)
