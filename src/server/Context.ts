import { pipe } from 'fp-ts/function'

import { StringUtils } from '../shared/utils/StringUtils'
import { Future, NonEmptyArray } from '../shared/utils/fp'

import type { Config } from './config/Config'
import { constants } from './config/constants'
import { HttpClient } from './helpers/HttpClient'
import { JwtHelper } from './helpers/JwtHelper'
import { LoggerGetter } from './models/logger/LoggerGetter'
import { MongoCollectionGetter } from './models/mongo/MongoCollection'
import { WithDb } from './models/mongo/WithDb'
import { HealthCheckPersistence } from './persistence/HealthCheckPersistence'
import { MigrationPersistence } from './persistence/MigrationPersistence'
import { SummonerPersistence } from './persistence/SummonerPersistence'
import { UserPersistence } from './persistence/UserPersistence'
import { HealthCheckService } from './services/HealthCheckService'
import { MigrationService } from './services/MigrationService'
import { RiotApiService } from './services/RiotApiService'
import { SummonerService } from './services/SummonerService'
import { UserService } from './services/UserService'
import { getOnError } from './utils/getOnError'

type Context = ReturnType<typeof of>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  config: Config,
  Logger: LoggerGetter,
  healthCheckPersistence: HealthCheckPersistence,
  summonerPersistence: SummonerPersistence,
  userPersistence: UserPersistence,
) => {
  const httpClient = HttpClient(Logger)
  const jwtHelper = JwtHelper(config.jwtSecret)

  const healthCheckService = HealthCheckService(healthCheckPersistence)
  const riotApiService = RiotApiService(config.riotApiKey, httpClient)
  const summonerService = SummonerService(riotApiService, summonerPersistence)
  const userService = UserService(Logger, userPersistence, jwtHelper)

  return {
    config,
    Logger,
    healthCheckService,
    riotApiService,
    summonerService,
    userService,
  }
}

const load = (config: Config): Future<Context> => {
  const Logger = LoggerGetter(config.logLevel)
  const logger = Logger('Context')

  const withDb = WithDb.of(getOnError(logger), {
    url: `mongodb://${config.db.user}:${config.db.password}@${config.db.host}`,
    dbName: config.db.dbName,
  })

  const mongoCollection: MongoCollectionGetter = MongoCollectionGetter.fromWithDb(withDb)

  const healthCheckPersistence = HealthCheckPersistence(withDb)
  const migrationPersistence = MigrationPersistence(Logger, mongoCollection)
  const summonerPersistence = SummonerPersistence(Logger, mongoCollection)
  const userPersistence = UserPersistence(Logger, mongoCollection)

  const context = of(config, Logger, healthCheckPersistence, summonerPersistence, userPersistence)
  const { healthCheckService } = context

  const migrationService = MigrationService(Logger, mongoCollection, migrationPersistence)

  const waitDatabaseReady: Future<boolean> = pipe(
    healthCheckService.check(),
    Future.orElse(() =>
      pipe(
        logger.info(
          `Couldn't connect to mongo, waiting ${StringUtils.prettyMs(
            constants.dbRetryDelay,
          )} before next try`,
        ),
        Future.fromIOEither,
        Future.chain(() => pipe(waitDatabaseReady, Future.delay(constants.dbRetryDelay))),
      ),
    ),
    Future.filterOrElse(
      success => success,
      () => Error("HealthCheck wasn't success"),
    ),
  )

  return pipe(
    logger.info('Ensuring indexes'),
    Future.fromIOEither,
    Future.chain(() => waitDatabaseReady),
    Future.chain(() => migrationService.applyMigrations),
    Future.chain(() =>
      NonEmptyArray.sequence(Future.ApplicativeSeq)([
        summonerPersistence.ensureIndexes,
        userPersistence.ensureIndexes,
      ]),
    ),
    Future.chainIOEitherK(() => logger.info('Ensured indexes')),
    Future.map(() => context),
  )
}

const Context = { load }

export { Context }
