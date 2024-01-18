import { apply, monoid, number, ord, separated, task } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { Business } from '../../shared/Business'
import type { DayJs } from '../../shared/models/DayJs'
import type { Lang } from '../../shared/models/api/Lang'
import { MapId } from '../../shared/models/api/MapId'
import type { Platform } from '../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameMasteriesView } from '../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../shared/models/api/activeGame/ActiveGameView'
import { SummonerActiveGameView } from '../../shared/models/api/activeGame/SummonerActiveGameView'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { ChampionShardsView } from '../../shared/models/api/summoner/ChampionShardsView'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import { RiotId } from '../../shared/models/riot/RiotId'
import type { SummonerName } from '../../shared/models/riot/SummonerName'
import { Sink } from '../../shared/models/rx/Sink'
import { TObservable } from '../../shared/models/rx/TObservable'
import { DictUtils } from '../../shared/utils/DictUtils'
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
import { ActiveGameParticipant } from '../models/activeGame/ActiveGameParticipant'
import type { PoroActiveGame } from '../models/activeGame/PoroActiveGame'
import { PoroActiveGameParticipant } from '../models/activeGame/PoroActiveGameParticipant'
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import { LeagueEntry } from '../models/league/LeagueEntry'
import { Leagues } from '../models/league/Leagues'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { Summoner, SummonerWithRiotId } from '../models/summoner/Summoner'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { TokenContent } from '../models/user/TokenContent'
import type { WikiaChampionData } from '../models/wikia/WikiaChampionData'
import { WikiaChampionPosition } from '../models/wikia/WikiaChampionPosition'
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

    masteriesByName:
      (platform: Platform, name: SummonerName) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          summonerService.findByName(platform, name),
          futureMaybe.bind('riotId', summoner =>
            pipe(
              riotAccountService.findByPuuid(summoner.puuid),
              futureMaybe.map(a => a.riotId),
            ),
          ),
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

    activeGameByName:
      (lang: Lang, platform: Platform, name: SummonerName) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          summonerService.findByName(platform, name),
          futureMaybe.bind('riotId', summoner =>
            pipe(
              riotAccountService.findByPuuid(summoner.puuid),
              futureMaybe.map(a => a.riotId),
            ),
          ),
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
          findLeagues(platform, summoner.id),
          Future.map(Either.fromOption(() => 'Leagues not found')),
        ),
      ),
      futureEither.bind('masteries', ({ summoner }) =>
        pipe(
          masteriesService.findBySummoner(platform, summoner.puuid),
          Future.map(Either.fromOption(() => 'Masteries not found')),
        ),
      ),
      futureEither.bind('championShards', ({ summoner, masteries }) =>
        pipe(
          futureMaybe.fromOption(maybeUser),
          futureMaybe.chainTaskEitherK(user =>
            findChampionShards(user, summoner, masteries.champions),
          ),
          Future.map(Either.right),
        ),
      ),
      M.fromTaskEither,
      M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(SummonerMasteriesView.codec))),
    )
  }

  function findLeagues(
    platform: Platform,
    summonerId: SummonerId,
    options?: { overrideInsertedAfter: DayJs },
  ): Future<Maybe<SummonerLeaguesView>> {
    return pipe(
      leagueEntryService.findBySummoner(platform, summonerId, options),
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
    masteries: List<ChampionMastery>,
  ): Future<List<ChampionShardsView>> {
    return pipe(
      userService.listChampionShardsForSummoner(user.id, summoner.id),
      TObservable.chainEitherK(({ champion, count, updatedWhenChampionLevel }) =>
        pipe(
          pipe(
            masteries,
            ListUtils.findFirstBy(ChampionKey.Eq)(m => m.championId),
          )(champion),
          Maybe.map(m => m.championLevel),
          Maybe.getOrElse((): ChampionLevel => 0),
          shouldNotifyChampionLeveledUp(count)(updatedWhenChampionLevel),
          Try.map(
            (maybeShardsToRemove): ChampionShardsView => ({
              champion,
              count,
              shardsToRemoveFromNotification: pipe(
                maybeShardsToRemove,
                Maybe.map(shardsToRemove => ({
                  leveledUpFrom: updatedWhenChampionLevel,
                  shardsToRemove,
                })),
              ),
            }),
          ),
        ),
      ),
      Sink.readonlyArray,
    )
  }

  function findActiveGame(
    lang: Lang,
    maybeUser: Maybe<TokenContent>,
  ): (summoner: Future<Maybe<SummonerWithRiotId>>) => EndedMiddleware {
    return flow(
      Future.map(Either.fromOption(() => 'Summoner not found')),
      futureEither.chain(summoner =>
        pipe(
          activeGame(lang, summoner, maybeUser),
          Future.map(game => Either.right<never, SummonerActiveGameView>({ summoner, game })),
        ),
      ),
      M.fromTaskEither,
      M.ichain(
        Either.fold(M.sendWithStatus(Status.NotFound), M.json(SummonerActiveGameView.codec)),
      ),
    )
  }

  function activeGame(
    lang: Lang,
    summoner: SummonerWithRiotId,
    maybeUser: Maybe<TokenContent>,
  ): Future<Maybe<ActiveGameView>> {
    return pipe(
      activeGameService.findBySummoner(summoner.platform, summoner.id),
      futureMaybe.chainTaskEitherK(game =>
        pipe(
          poroActiveGameService.find(lang, game.gameId, summoner.platform, summoner.riotId),
          task.chain(
            Try.fold(
              e =>
                pipe(
                  logger.warn('Error while fetching Poro game (falling back to Riot API only):', e),
                  Future.fromIOEither,
                  Future.chain(() => activeGameRiot(summoner.platform, maybeUser, game)),
                ),
              Maybe.fold(
                () =>
                  pipe(
                    logger.warn('Poro game not found while Riot API returned one'),
                    Future.fromIOEither,
                    Future.chain(() => activeGameRiot(summoner.platform, maybeUser, game)),
                  ),
                activeGamePoro(summoner.platform, maybeUser, game),
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
        champions: staticDataService.wikiaChampions,
        participants: pipe(
          game.participants,
          PartialDict.traverse(Future.ApplicativePar)(
            NonEmptyArray.traverse(Future.ApplicativePar)(
              enrichParticipantRiot(platform, maybeUser, game.insertedAt),
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
  ): (participant: ActiveGameParticipant) => Future<ActiveGameParticipantView> {
    return participant =>
      pipe(
        apply.sequenceS(Future.ApplyPar)({
          riotAccount: pipe(
            riotAccountService.findByPuuid(participant.puuid),
            futureMaybe.getOrElse(() => Future.failed(couldntFindAccountError(participant.puuid))),
          ),
          leagues: findLeagues(platform, participant.summonerId, {
            overrideInsertedAfter: gameInsertedAt,
          }),
          masteriesAndShardsCount: findMasteriesAndShardsCount(
            platform,
            maybeUser,
            gameInsertedAt,
            participant,
          ),
        }),
        Future.map(
          ({ riotAccount, leagues, masteriesAndShardsCount: { masteries, shardsCount } }) =>
            pipe(
              participant,
              ActiveGameParticipant.toView({
                riotId: riotAccount.riotId,
                leagues,
                masteries,
                shardsCount,
              }),
            ),
        ),
      )
  }

  function couldntFindAccountError(puuid: Puuid): Error {
    return Error(`Couldn't find Riot account for summoner: ${puuid}`)
  }

  type EnrichedActiveGameParticipant = ActiveGameParticipant & {
    riotId: RiotId
  }

  function activeGamePoro(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    game: ActiveGame,
  ): (poroGame: PoroActiveGame) => Future<ActiveGameView> {
    return poroGame =>
      pipe(
        DictUtils.values(game.participants),
        List.flatten,
        List.traverse(Future.ApplicativePar)(p =>
          pipe(
            riotAccountService.findByPuuid(p.puuid),
            futureMaybe.getOrElse(() => Future.failed(couldntFindAccountError(p.puuid))),
            Future.map((a): EnrichedActiveGameParticipant => ({ ...p, riotId: a.riotId })),
          ),
        ),
        Future.chain(participants =>
          pipe(
            poroGame.participants,
            PartialDict.traverse(Future.ApplicativePar)(
              NonEmptyArray.traverse(Future.ApplicativePar)(
                enrichParticipantPoro(platform, maybeUser, participants, game.insertedAt),
              ),
            ),
          ),
        ),
        Future.map<ActiveGameView['participants'], ActiveGameView>(participants => ({
          gameStartTime: game.gameStartTime,
          mapId: game.mapId,
          gameQueueConfigId: game.gameQueueConfigId,
          isDraft: game.isDraft,
          bannedChampions: game.bannedChampions,
          participants,
          isPoroOK: true,
        })),
      )
  }

  function enrichParticipantPoro(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    participants: List<EnrichedActiveGameParticipant>,
    gameInsertedAt: DayJs,
  ): (poroParticipant: PoroActiveGameParticipant) => Future<ActiveGameParticipantView> {
    return poroParticipant => {
      const maybeParticipant = pipe(
        participants,
        List.findFirst(p => RiotId.Eq.equals(RiotId.trim(p.riotId), poroParticipant.riotId)),
      )

      if (!Maybe.isSome(maybeParticipant)) {
        return Future.failed(
          Error(
            `Poro participant: couldn't find matching Riot API participant: ${RiotId.stringify(
              poroParticipant.riotId,
            )}`,
          ),
        )
      }

      const participant = maybeParticipant.value

      return pipe(
        findMasteriesAndShardsCount(platform, maybeUser, gameInsertedAt, participant),
        Future.map(({ masteries, shardsCount }) =>
          pipe(
            poroParticipant,
            PoroActiveGameParticipant.toView({ participant, masteries, shardsCount }),
          ),
        ),
      )
    }
  }

  function findMasteriesAndShardsCount(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    gameInsertedAt: DayJs,
    participant: ActiveGameParticipant,
  ): Future<{
    masteries: Maybe<ActiveGameMasteriesView>
    shardsCount: Maybe<number>
  }> {
    return apply.sequenceS(Future.ApplyPar)({
      masteries: pipe(
        masteriesService.findBySummoner(platform, participant.puuid, {
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
              )(participant.championId),
              Maybe.map(
                (m): ActiveGameChampionMasteryView => ({
                  championLevel: m.championLevel,
                  championPoints: m.championPoints,
                  championPointsSinceLastLevel: m.championPointsSinceLastLevel,
                  championPointsUntilNextLevel: m.championPointsUntilNextLevel,
                  chestGranted: m.chestGranted,
                  tokensEarned: m.tokensEarned,
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
            participant.summonerId,
            participant.championId,
          ),
        ),
        futureMaybe.map(s => s.count),
      ),
    })
  }
}

export { SummonerController }

/**
 * @returns shards to remove, if some
 */
export const shouldNotifyChampionLeveledUp =
  (shardsCount: number) =>
  (oldLevel: ChampionLevel) =>
  (newLevel: ChampionLevel): Try<Maybe<number>> => {
    if (newLevel < oldLevel) {
      return Try.failure(
        Error(`shouldNotifyChampionLeveledUp: oldLevel should be equal to or lower than newLevel`),
      )
    }
    const diff = Math.min(shardsCount, newLevel - Math.max(oldLevel, 5))
    return Try.success(diff <= 0 ? Maybe.none : Maybe.some(diff))
  }

/**
 * Try to sort participants by positions
 */
const sortParticipants =
  (champions: List<WikiaChampionData>) =>
  (mapId: MapId) =>
  (
    participants: NonEmptyArray<ActiveGameParticipantView>,
  ): NonEmptyArray<ActiveGameParticipantView> => {
    if (!MapId.isSummonersRift(mapId)) return participants

    return sortTeamParticipants(champions)(participants)
  }

type ParticipantWithChampion = Tuple<ActiveGameParticipantView, WikiaChampionData>
type Positions = PartialDict<ChampionPosition, ActiveGameParticipantView>

const sortTeamParticipants =
  (champions: List<WikiaChampionData>) =>
  (
    participants: NonEmptyArray<ActiveGameParticipantView>,
  ): NonEmptyArray<ActiveGameParticipantView> => {
    const championByKey = pipe(
      champions,
      ListUtils.findFirstBy(ChampionKey.Eq)(c => c.id),
    )

    // we won't be able to do much without associated wikia positions
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
                c.positions,
                Maybe.exists(
                  List.some(p =>
                    ChampionPosition.Eq.equals(WikiaChampionPosition.position[p], position),
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
    c.positions,
    Maybe.exists(p => p.length === 1),
  )

// sort champions who have only one position before others
const ordByPositionCount: Ord<ParticipantWithChampion> = pipe(
  number.Ord,
  ord.contramap((p: ParticipantWithChampion) => (hasOnePosition(p) ? 1 : 2)),
)
