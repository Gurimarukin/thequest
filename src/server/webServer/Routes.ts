import type { ParserWithMethod } from '../../shared/ApiRouter'
import { apiParsers as api } from '../../shared/ApiRouter'
import { MsDuration } from '../../shared/models/MsDuration'
import type { List } from '../../shared/utils/fp'

import type { HealthCheckController } from '../controllers/HealthCheckController'
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
  healthCheckController: HealthCheckController,
  staticDataController: StaticDataController,
  summonerController: SummonerController,
  userController: UserController,
): List<Route> => {
  const { middleware: withAuth } = withAuth_

  return [
    m(api.healthcheck.get, () => healthCheckController.check),
    m(api.staticData.lang.get, ({ lang }) => staticDataController.staticData(lang)),
    m(api.platform.summoner.byName.get, ({ platform, summonerName }) =>
      summonerController.byName(platform, summonerName),
    ),
    m(api.user.self.get, () => withAuth(userController.getSelfUser)),
    m(api.user.login.post, () => rateLimiter(2, MsDuration.minutes(1))(userController.login)),
    m(api.user.logout.post, () => userController.logout),
  ]
}

const m = <A>(
  [parser, method]: ParserWithMethod<A>,
  f: (a: A) => EndedMiddleware,
): RouteMiddleware => Route.Middleware([method, parser.map(f)])
