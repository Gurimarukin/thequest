import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'
import type { Platform } from '../../shared/models/api/Platform'
import type { ChampionShardsView } from '../../shared/models/api/summoner/ChampionShardsView'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Dict, Either, Future, List, Maybe, NonEmptyArray, Try, Tuple } from '../../shared/utils/fp'
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

type SummonerController = Readonly<ReturnType<typeof SummonerController>>

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
  ): Future<ChampionShardsView> {
    return pipe(
      userService.listChampionShardsForSummoner(user.id, summoner.id),
      Future.chainEitherK(championShards =>
        pipe(
          championShards,
          List.traverse(Try.Applicative)(({ champion, updatedWhenChampionLevel }) =>
            pipe(
              masteries,
              List.findFirst(m => ChampionKey.Eq.equals(m.championId, champion)),
              Maybe.fold(
                (): ChampionLevelOrZero => 0,
                m => m.championLevel,
              ),
              shouldNotifyChampionLeveledUp(updatedWhenChampionLevel),
              Try.map(
                Maybe.map(() =>
                  Tuple.of(ChampionKey.stringify(champion), updatedWhenChampionLevel),
                ),
              ),
            ),
          ),
          Try.map(leveledUpFromNotifications => ({
            counts: pipe(
              championShards,
              List.map(({ champion, count }) => Tuple.of(ChampionKey.stringify(champion), count)),
              Dict.fromEntries,
            ),
            leveledUpFromNotifications: pipe(
              leveledUpFromNotifications,
              List.compact,
              NonEmptyArray.fromReadonlyArray,
              Maybe.map(Dict.fromEntries),
            ),
          })),
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
  (oldLevel: ChampionLevelOrZero) =>
  (newLevel: ChampionLevelOrZero): Try<Maybe<number>> => {
    if (newLevel < oldLevel) {
      return Try.failure(
        Error(`shouldNotifyChampionLeveledUp: oldLevel should be equal to or lower than newLevel`),
      )
    }
    const diff = newLevel - Math.max(oldLevel, 5)
    return Try.success(diff <= 0 ? Maybe.none : Maybe.some(Math.min(diff, 2)))
  }
