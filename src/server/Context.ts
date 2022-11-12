import { pipe } from 'fp-ts/function'

import { StringUtils } from '../shared/utils/StringUtils'
import { Future, NonEmptyArray } from '../shared/utils/fp'

import type { Config } from './config/Config'
import { constants } from './config/constants'
import { JwtHelper } from './helpers/JwtHelper'
import { LoggerGetter } from './models/logger/LoggerGetter'
import { MongoCollectionGetter } from './models/mongo/MongoCollection'
import { WithDb } from './models/mongo/WithDb'
import { HealthCheckPersistence } from './persistence/HealthCheckPersistence'
import { MigrationPersistence } from './persistence/MigrationPersistence'
import { UserPersistence } from './persistence/UserPersistence'
import { HealthCheckService } from './services/HealthCheckService'
import { MigrationService } from './services/MigrationService'
import { getOnError } from './utils/getOnError'

type Context = ReturnType<typeof of>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  config: Config,
  Logger: LoggerGetter,
  withDb: WithDb,
  mongoCollection: MongoCollectionGetter,
) => {
  const healthCheckPersistence = HealthCheckPersistence(withDb)
  const userPersistence = UserPersistence(Logger, mongoCollection)

  const healthCheckService = HealthCheckService(healthCheckPersistence)

  const jwtHelper = JwtHelper(config.jwtSecret)

  return {
    config,
    Logger,
    userPersistence,
    healthCheckService,
    jwtHelper,
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

  const context = of(config, Logger, withDb, mongoCollection)
  const { userPersistence, healthCheckService } = context

  const migrationPersistence = MigrationPersistence(Logger, mongoCollection)

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
      NonEmptyArray.sequence(Future.ApplicativeSeq)([userPersistence.ensureIndexes]),
    ),
    Future.chainIOEitherK(() => logger.info('Ensured indexes')),
    Future.map(() => context),
  )
}

const Context = { load }

export { Context }
