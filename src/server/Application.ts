import { pipe } from 'fp-ts/function'

import type { NotUsed } from '../shared/utils/fp'
import { IO } from '../shared/utils/fp'

import type { Context } from './Context'
import { constants } from './config/constants'
import { HealthCheckController } from './controllers/HealthCheckController'
import { StaticDataController } from './controllers/StaticDataController'
import { SummonerController } from './controllers/SummonerController'
import { UserController } from './controllers/UserController'
import { Routes } from './webServer/Routes'
import { startWebServer } from './webServer/startWebServer'
import { RateLimiter } from './webServer/utils/RateLimiter'
import { WithAuth } from './webServer/utils/WithAuth'
import { WithIp } from './webServer/utils/WithIp'

export const Application = ({
  config,
  Logger,
  healthCheckService,
  riotApiService,
  summonerService,
  masteriesService,
  userService,
}: Context): IO<NotUsed> => {
  const logger = Logger('Application')

  const healthCheckController = HealthCheckController(healthCheckService)
  const staticDataController = StaticDataController(riotApiService)
  const summonerController = SummonerController(summonerService, masteriesService)
  const userController = UserController(summonerService, userService)

  const withIp = WithIp(Logger, config)
  const rateLimiter = RateLimiter(Logger, withIp, constants.rateLimiterLifeTime)
  const withAuth = WithAuth(userService)

  const routes = Routes(
    rateLimiter,
    withAuth,
    healthCheckController,
    staticDataController,
    summonerController,
    userController,
  )

  return pipe(
    startWebServer(Logger, config.http, routes),
    IO.chain(() => logger.info('Started')),
  )
}
