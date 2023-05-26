import { apply, monoid, number } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { ActiveGameMasteryView } from '../../shared/models/api/activeGame/ActiveGameMasteryView'
import type { ActiveGameParticipantView } from '../../shared/models/api/activeGame/ActiveGameParticipantView'
import { ActiveGameView } from '../../shared/models/api/activeGame/ActiveGameView'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionShardsView } from '../../shared/models/api/summoner/ChampionShardsView'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Sink } from '../../shared/models/rx/Sink'
import { TObservable } from '../../shared/models/rx/TObservable'
import { Either, Future, List, Maybe, Try } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { ActiveGame } from '../models/activeGame/ActiveGame'
import { ActiveGameParticipant } from '../models/activeGame/ActiveGameParticipant'
import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import type { Summoner } from '../models/summoner/Summoner'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { TokenContent } from '../models/user/TokenContent'
import type { ActiveGameService } from '../services/ActiveGameService'
import type { LeagueEntryService } from '../services/LeagueEntryService'
import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
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
  leagueEntryService: LeagueEntryService,
  masteriesService: MasteriesService,
  summonerService: SummonerService,
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

    activeGame:
      (platform: Platform, summonerName: string) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          summonerService.findByName(platform, summonerName),
          Future.map(Either.fromOption(() => 'Summoner not found')),
          futureEither.chain(summoner =>
            pipe(activeGame(platform, summoner.id, maybeUser), Future.map(Either.right)),
          ),
          M.fromTaskEither,
          M.ichain(
            Either.fold(
              M.sendWithStatus(Status.NotFound),
              M.json(Maybe.encoder(ActiveGameView.codec)),
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
          masteries,
          List.findFirst(m => ChampionKey.Eq.equals(m.championId, champion)),
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
    platform: Platform,
    summonerId: SummonerId,
    maybeUser: Maybe<TokenContent>,
  ): Future<Maybe<ActiveGameView>> {
    return pipe(
      activeGameService.findBySummoner(platform, summonerId),
      futureMaybe.chainTaskEitherK(game =>
        pipe(
          game.participants,
          List.traverse(Future.ApplicativePar)(
            enrichParticipant(platform, maybeUser, game.gameStartTime),
          ),
          Future.map(participants => pipe(game, ActiveGame.toView(participants))),
        ),
      ),
    )
  }

  function enrichParticipant(
    platform: Platform,
    maybeUser: Maybe<TokenContent>,
    gameStartTime: DayJs,
  ): (participant: ActiveGameParticipant) => Future<ActiveGameParticipantView> {
    return participant =>
      pipe(
        apply.sequenceS(Future.ApplyPar)({
          leagues: findLeagues(platform, participant.summonerId, {
            overrideInsertedAfter: gameStartTime,
          }),
          masteries: masteriesService.findBySummoner(platform, participant.summonerId, {
            overrideInsertedAfter: gameStartTime,
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
        Future.map(({ leagues, masteries, shardsCount }) =>
          pipe(
            participant,
            ActiveGameParticipant.toView({
              leagues,
              totalMasteryScore: pipe(
                masteries,
                Maybe.fold(
                  () => 0,
                  flow(
                    List.map(m => m.championLevel),
                    monoid.concatAll(number.MonoidSum),
                  ),
                ),
              ),
              mastery: pipe(
                masteries,
                Maybe.chain(
                  List.findFirst(m => ChampionKey.Eq.equals(m.championId, participant.championId)),
                ),
                Maybe.map(
                  (m): ActiveGameMasteryView => ({
                    championLevel: m.championLevel,
                    championPoints: m.championPoints,
                    championPointsSinceLastLevel: m.championPointsSinceLastLevel,
                    championPointsUntilNextLevel: m.championPointsUntilNextLevel,
                    chestGranted: m.chestGranted,
                    tokensEarned: m.tokensEarned,
                  }),
                ),
              ),
              shardsCount: pipe(
                shardsCount,
                Maybe.fold(
                  () => 0,
                  s => s.count,
                ),
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
