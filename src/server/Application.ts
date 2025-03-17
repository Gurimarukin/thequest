import { pipe } from 'fp-ts/function'

import { MsDuration } from '../shared/models/MsDuration'
import type { NotUsed } from '../shared/utils/fp'
import { IO } from '../shared/utils/fp'

import type { Context } from './Context'
import { AdminController } from './controllers/AdminController'
import { HealthCheckController } from './controllers/HealthCheckController'
import { MadosayentisutoController } from './controllers/MadosayentisutoController'
import { StaticDataController } from './controllers/StaticDataController'
import { SummonerController } from './controllers/SummonerController'
import { UserController } from './controllers/UserController'
import { Routes } from './webServer/Routes'
import { startWebServer } from './webServer/startWebServer'
import { RateLimiter } from './webServer/utils/RateLimiter'
import { WithAuth } from './webServer/utils/WithAuth'
import { WithIp } from './webServer/utils/WithIp'

const rateLimiterLifeTime = MsDuration.days(1)

export const Application = ({
  config,
  Logger,
  activeGameService,
  challengesService,
  ddragonService,
  discordService,
  healthCheckService,
  leagueEntryService,
  hallOfFameMemberService,
  masteriesService,
  matchService,
  poroActiveGameService,
  riotAccountService,
  staticDataService,
  summonerService,
  userService,
}: Context): IO<NotUsed> => {
  const logger = Logger('Application')

  const withIp = WithIp(Logger, config)

  const adminController = AdminController(
    config.madosayentisuto,
    discordService,
    hallOfFameMemberService,
    riotAccountService,
    summonerService,
  )
  const healthCheckController = HealthCheckController(healthCheckService)
  const staticDataController = StaticDataController(staticDataService)
  const summonerController = SummonerController(
    Logger,
    activeGameService,
    challengesService,
    leagueEntryService,
    masteriesService,
    poroActiveGameService,
    riotAccountService,
    summonerService,
    staticDataService,
    userService,
  )
  const userController = UserController(
    Logger,
    ddragonService,
    discordService,
    masteriesService,
    riotAccountService,
    summonerService,
    userService,
  )

  const madosayentisutoController = MadosayentisutoController(
    config.madosayentisuto,
    withIp,
    ddragonService,
    hallOfFameMemberService,
    masteriesService,
    matchService,
    riotAccountService,
    summonerService,
    staticDataService,
  )

  const rateLimiter = RateLimiter(Logger, withIp, rateLimiterLifeTime)
  const withAuth = WithAuth(userService)

  const routes = Routes(
    rateLimiter,
    withAuth,
    adminController,
    healthCheckController,
    madosayentisutoController,
    staticDataController,
    summonerController,
    userController,
  )

  return pipe(
    startWebServer(Logger, config.http, routes),
    IO.chain(() => logger.info('Started')),
  )
}
