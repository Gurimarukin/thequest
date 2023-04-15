import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { Platform } from '../../shared/models/api/Platform'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionShardsView } from '../../shared/models/api/summoner/ChampionShardsView'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Sink } from '../../shared/models/rx/Sink'
import { TObservable } from '../../shared/models/rx/TObservable'
import { Either, Future, List, Maybe, Try } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { ChampionMastery } from '../models/championMastery/ChampionMastery'
import type { Summoner } from '../models/summoner/Summoner'
import type { TokenContent } from '../models/user/TokenContent'
import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type SummonerController = ReturnType<typeof SummonerController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerController = (
  summonerService: SummonerService,
  masteriesService: MasteriesService,
  userService: UserService,
) => {
  return {
    findByName:
      (platform: Platform, summonerName: string) =>
      (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
        pipe(
          summonerService.findByName(platform, summonerName),
          Future.map(Either.fromOption(() => 'Summoner not found')),
          futureEither.bindTo('summoner'),
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
        ),
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
