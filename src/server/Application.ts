import { pipe } from 'fp-ts/function'

import type { NotUsed } from '../shared/utils/fp'
import { IO } from '../shared/utils/fp'

import type { Context } from './Context'
import { constants } from './config/constants'
import { HealthCheckController } from './controllers/HealthCheckController'
import { UserController } from './controllers/UserController'
import { UserService } from './services/UserService'
import { Routes } from './webServer/Routes'
import { startWebServer } from './webServer/startWebServer'
import { RateLimiter } from './webServer/utils/RateLimiter'
import { WithAuth } from './webServer/utils/WithAuth'
import { WithIp } from './webServer/utils/WithIp'

export const Application = ({
  config,
  Logger,
  userPersistence,
  healthCheckService,
  jwtHelper,
}: Context): IO<NotUsed> => {
  const logger = Logger('Application')

  const userService = UserService(userPersistence, jwtHelper)

  const healthCheckController = HealthCheckController(healthCheckService)
  const userController = UserController(userService)

  const withIp = WithIp(Logger, config)
  const rateLimiter = RateLimiter(Logger, withIp, constants.rateLimiterLifeTime)
  const withAuth = WithAuth(userService)

  const routes = Routes(rateLimiter, withAuth, healthCheckController, userController)

  return pipe(
    startWebServer(Logger, config.http, routes),
    IO.chain(() => logger.info('Started')),
  )
}
