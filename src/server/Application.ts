import { pipe } from 'fp-ts/function'

import type { NotUsed } from '../shared/utils/fp'
import { IO } from '../shared/utils/fp'

import type { Context } from './Context'
import { constants } from './config/constants'
import { HealthCheckController } from './controllers/HealthCheckController'
import { SummonerController } from './controllers/SummonerController'
import { UserController } from './controllers/UserController'
import { HttpClient } from './helpers/HttpClient'
import { RiotApiService } from './services/RiotApiService'
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

  const httpClient = HttpClient(Logger)

  const riotApiService = RiotApiService(config.riotApiKey, httpClient)
  const userService = UserService(userPersistence, jwtHelper)

  const healthCheckController = HealthCheckController(healthCheckService)
  const summonerController = SummonerController(riotApiService)
  const userController = UserController(userService)

  const withIp = WithIp(Logger, config)
  const rateLimiter = RateLimiter(Logger, withIp, constants.rateLimiterLifeTime)
  const withAuth = WithAuth(userService)

  const routes = Routes(
    rateLimiter,
    withAuth,
    healthCheckController,
    summonerController,
    userController,
  )

  return pipe(
    startWebServer(Logger, config.http, routes),
    IO.chain(() => logger.info('Started')),
  )
}
