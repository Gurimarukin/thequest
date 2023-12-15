import type { ParserWithMethod } from '../../shared/ApiRouter'
import { apiParsers as api } from '../../shared/ApiRouter'
import { MsDuration } from '../../shared/models/MsDuration'
import { type List } from '../../shared/utils/fp'

import type { AdminController } from '../controllers/AdminController'
import type { HealthCheckController } from '../controllers/HealthCheckController'
import type { MadosayentisutoController } from '../controllers/MadosayentisutoController'
import type { StaticDataController } from '../controllers/StaticDataController'
import type { SummonerController } from '../controllers/SummonerController'
import type { UserController } from '../controllers/UserController'
import type { EndedMiddleware } from './models/MyMiddleware'
import type { RouteMiddleware } from './models/Route'
import { Route } from './models/Route'
import type { RateLimiter } from './utils/RateLimiter'
import type { WithAuth } from './utils/WithAuth'

export const Routes = (
  rateLimiter: RateLimiter,
  withAuth_: WithAuth,
  adminController: AdminController,
  healthCheckController: HealthCheckController,
  madosayentisutoController: MadosayentisutoController,
  staticDataController: StaticDataController,
  summonerController: SummonerController,
  userController: UserController,
): List<Route> => {
  const { middleware: withAuth, middlewareMaybe: maybeWithAuth } = withAuth_

  return [
    m(api.healthcheck.get, () => healthCheckController.check),

    m(api.staticData.lang.get, ({ lang }) => staticDataController.staticData(lang)),
    m(api.staticData.lang.additional.get, ({ lang }) =>
      staticDataController.additionalStaticData(lang),
    ),

    m(api.summoner.byPuuid.masteries.get, ({ platform, puuid }) =>
      maybeWithAuth(summonerController.masteriesByPuuid(platform, puuid)),
    ),
    m(api.summoner.byPuuid.challenges.get, ({ platform, puuid }) =>
      summonerController.challengesByPuuid(platform, puuid),
    ),
    m(api.summoner.byPuuid.activeGame.lang.get, ({ platform, puuid, lang }) =>
      maybeWithAuth(summonerController.activeGameByPuuid(lang, platform, puuid)),
    ),

    m(api.summoner.byName.masteries.get, ({ platform, summonerName }) =>
      maybeWithAuth(summonerController.masteriesByName(platform, summonerName)),
    ),
    m(api.summoner.byName.activeGame.lang.get, ({ platform, summonerName, lang }) =>
      maybeWithAuth(summonerController.activeGameByName(lang, platform, summonerName)),
    ),

    m(api.summoner.byRiotId.get, ({ platform, riotId }) =>
      summonerController.summonerShortByRiotId(platform, riotId),
    ),
    m(api.summoner.byRiotId.masteries.get, ({ platform, riotId }) =>
      maybeWithAuth(summonerController.masteriesByRiotId(platform, riotId)),
    ),
    m(api.summoner.byRiotId.activeGame.lang.get, ({ platform, riotId, lang }) =>
      maybeWithAuth(summonerController.activeGameByRiotId(lang, platform, riotId)),
    ),

    m(api.user.self.get, () => withAuth(userController.getSelf)),
    m(api.user.self.favorites.put, () => withAuth(userController.addFavoriteSelf)),
    m(api.user.self.favorites.delete, () => withAuth(userController.removeFavoriteSelf)),
    m(api.user.self.summoner.championsShardsCount.post, ({ platform, puuid }) =>
      withAuth(userController.setChampionsShardsCount(platform, puuid)),
    ),
    m(api.user.login.discord.post, () =>
      rateLimiter(2, MsDuration.minute(1))(userController.loginDiscord),
    ),
    m(api.user.login.password.post, () =>
      rateLimiter(2, MsDuration.minute(1))(userController.loginPassword),
    ),
    m(api.user.logout.post, () => userController.logout),
    m(api.user.register.discord.post, () =>
      rateLimiter(2, MsDuration.minute(1))(userController.registerDiscord),
    ),
    m(api.user.register.password.post, () =>
      rateLimiter(2, MsDuration.minute(1))(userController.registerPassword),
    ),

    m(api.admin.hallOfFame.get, () => withAuth(adminController.listHallOfFame)),
    m(api.admin.hallOfFame.post, () => withAuth(adminController.updateHallOfFame)),

    m(api.madosayentisuto.staticData.get, () => madosayentisutoController.getStaticData),
    m(
      api.madosayentisuto.users.getProgression.post,
      () => madosayentisutoController.getUsersProgression,
    ),
  ]
}

const m = <A>(
  [parser, method]: ParserWithMethod<A>,
  f: (a: A) => EndedMiddleware,
): RouteMiddleware => Route.Middleware([method, parser.map(f)])
