import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { Platform } from '../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Either, Future, List, Maybe } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'

import type { ChampionShardsDb } from '../models/user/ChampionShardsDb'
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
) => ({
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
        futureEither.bind('championShards', ({ summoner }) =>
          pipe(
            maybeUser,
            Maybe.fold(
              () => Future.right<Maybe<List<ChampionShardsDb>>>(Maybe.none),
              user =>
                pipe(
                  userService.listChampionShardsForSummoner(user.id, summoner.id),
                  Future.map(Maybe.some),
                ),
            ),
            Future.map(a => Either.right<string, Maybe<List<ChampionShardsDb>>>(a)),
          ),
        ),
        M.fromTaskEither,
        M.ichain(
          Either.fold(
            M.sendWithStatus(Status.NotFound),
            ({ summoner, masteries, championShards }) =>
              M.json(SummonerMasteriesView.codec)({
                summoner,
                masteries,
                championShards: pipe(
                  championShards,
                  Maybe.map(
                    List.reduce({}, (acc, { champion, count }) => ({
                      ...acc,
                      [ChampionKey.unwrap(champion)]: count,
                    })),
                  ),
                ),
              }),
          ),
        ),
      ),
})

export { SummonerController }
