import { apply, monoid, number, ord, separated } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { Business } from '../../shared/Business'
import type { DayJs } from '../../shared/models/DayJs'
import { MapId } from '../../shared/models/api/MapId'
import type { Platform } from '../../shared/models/api/Platform'
import type { ActiveGameChampionMasteryView } from '../../shared/models/api/activeGame/ActiveGameChampionMasteryView'
import type { ActiveGameMasteriesView } from '../../shared/models/api/activeGame/ActiveGameMasteriesView'
import type { ActiveGameParticipantView } from '../../shared/models/api/activeGame/ActiveGameParticipantView'
import { SummonerActiveGameView } from '../../shared/models/api/activeGame/SummonerActiveGameView'
import type { TeamId } from '../../shared/models/api/activeGame/TeamId'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { ChampionShardsView } from '../../shared/models/api/summoner/ChampionShardsView'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import { Sink } from '../../shared/models/rx/Sink'
import { TObservable } from '../../shared/models/rx/TObservable'
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
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import type { Summoner } from '../models/summoner/Summoner'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { TokenContent } from '../models/user/TokenContent'
import type { WikiaChampionData } from '../models/wikia/WikiaChampionData'
import { WikiaChampionPosition } from '../models/wikia/WikiaChampionPosition'
import type { ActiveGameService } from '../services/ActiveGameService'
import type { ChallengesService } from '../services/ChallengesService'
import type { LeagueEntryService } from '../services/LeagueEntryService'
import type { MasteriesService } from '../services/MasteriesService'
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerController = (
  activeGameService: ActiveGameService,
  challengesService: ChallengesService,
  leagueEntryService: LeagueEntryService,
  masteriesService: MasteriesService,
  summonerService: SummonerService,
  staticDataService: StaticDataService,
  userService: UserService,
) => {
  return {
    masteriesByPuuid:
      (platform: Platform, puuid: Puuid) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(summonerService.findByPuuid(platform, puuid), findMasteries(platform, maybeUser)),

    masteriesByName:
      (platform: Platform, summonerName: string) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          summonerService.findByName(platform, summonerName),
          findMasteries(platform, maybeUser),
        ),

    challenges: (platform: Platform, summonerName: string): EndedMiddleware =>
      pipe(
        summonerService.findByName(platform, summonerName),
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

    activeGame:
      (platform: Platform, summonerName: string) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          summonerService.findByName(platform, summonerName),
          Future.map(Either.fromOption(() => 'Summoner not found')),
          futureEither.chain(summoner =>
            pipe(activeGame(summoner, maybeUser), Future.map(Either.right)),
          ),
          M.fromTaskEither,
          M.ichain(
            Either.fold(
              M.sendWithStatus(Status.NotFound),
              M.json(Maybe.encoder(SummonerActiveGameView.codec)),
            ),
          ),
        ),
  }

  function findMasteries(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
  ): (futureSummoner: Future<Maybe<Summoner>>) => EndedMiddleware {
    return futureSummoner =>
      pipe(
        futureSummoner,
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
            masteriesService.findBySummoner(platform, summoner.id),
            Future.map(Either.fromOption(() => 'Masteries not found')),
          ),
        ),
        futureEither.bind('championShards', ({ summoner, masteries }) =>
          pipe(
            futureMaybe.fromOption(maybeUser),
            futureMaybe.chainTaskEitherK(user => findChampionShards(user, summoner, masteries)),
            Future.map(Either.right),
          ),
        ),
        M.fromTaskEither,
        M.ichain(
          Either.fold(M.sendWithStatus(Status.NotFound), M.json(SummonerMasteriesView.codec)),
        ),
      )
  }

  function findLeagues(
    platform: Platform,
    summonerId: SummonerId,
    options?: { overrideInsertedAfter: DayJs },
  ): Future<Maybe<SummonerLeaguesView>> {
    return pipe(
      leagueEntryService.findBySummoner(platform, summonerId, options),
      futureMaybe.map(entries => ({
        soloDuo: pipe(
          entries,
          List.findFirst(e => e.queueType === queueTypes.soloDuo),
        ),
        flex: pipe(
          entries,
          List.findFirst(e => e.queueType === queueTypes.flex),
        ),
      })),
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
          Maybe.getOrElse((): ChampionLevelOrZero => 0),
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

  function activeGame(
    summoner: Summoner,
    maybeUser: Maybe<TokenContent>,
  ): Future<Maybe<SummonerActiveGameView>> {
    return pipe(
      activeGameService.findBySummoner(summoner.platform, summoner.id),
      futureMaybe.bindTo('game'),
      futureMaybe.bind('champions', () =>
        pipe(staticDataService.wikiaChampions, futureMaybe.fromTaskEither),
      ),
      futureMaybe.chainTaskEitherK(({ game, champions }) =>
        pipe(
          game.participants,
          PartialDict.traverse(Future.ApplicativePar)(
            NonEmptyArray.traverse(Future.ApplicativePar)(
              enrichParticipant(summoner.platform, maybeUser, game.insertedAt),
            ),
          ),
          Future.map<
            PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipantView>>,
            SummonerActiveGameView
          >(
            flow(
              PartialDict.map(sortParticipants(champions)(game.mapId)),
              (sorted): SummonerActiveGameView => ({
                summoner,
                game: pipe(game, ActiveGame.toView(sorted)),
              }),
            ),
          ),
        ),
      ),
    )
  }

  function enrichParticipant(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    gameInsertedAt: DayJs,
  ): (participant: ActiveGameParticipant) => Future<ActiveGameParticipantView> {
    return participant =>
      pipe(
        apply.sequenceS(Future.ApplyPar)({
          leagues: findLeagues(platform, participant.summonerId, {
            overrideInsertedAfter: gameInsertedAt,
          }),
          maybeMasteries: masteriesService.findBySummoner(platform, participant.summonerId, {
            overrideInsertedAfter: gameInsertedAt,
          }),
          shardsCount: pipe(
            maybeUser,
            Maybe.fold(
              () => futureMaybe.none,
              user =>
                userService.findChampionShardsForChampion(
                  user.id,
                  participant.summonerId,
                  participant.championId,
                ),
            ),
          ),
        }),
        Future.map(({ leagues, maybeMasteries, shardsCount }) =>
          pipe(
            participant,
            ActiveGameParticipant.toView({
              leagues,
              masteries: pipe(
                maybeMasteries,
                Maybe.map(
                  (masteries): ActiveGameMasteriesView => ({
                    totalPercents: pipe(
                      masteries,
                      List.map(Business.championPercents),
                      NumberUtils.average,
                    ),
                    totalScore: pipe(
                      masteries,
                      List.map(m => m.championLevel),
                      monoid.concatAll(number.MonoidSum),
                    ),
                    champion: pipe(
                      pipe(
                        masteries,
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
                  }),
                ),
              ),
              shardsCount: pipe(
                shardsCount,
                Maybe.map(s => s.count),
              ),
            }),
          ),
        ),
      )
  }
}

export { SummonerController }

/**
 * @returns shards to remove, if some
 */
export const shouldNotifyChampionLeveledUp =
  (shardsCount: number) =>
  (oldLevel: ChampionLevelOrZero) =>
  (newLevel: ChampionLevelOrZero): Try<Maybe<number>> => {
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
