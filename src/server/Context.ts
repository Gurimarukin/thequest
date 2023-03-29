import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { PubSub } from '../shared/models/rx/PubSub'
import { StringUtils } from '../shared/utils/StringUtils'
import { Future, IO, NonEmptyArray } from '../shared/utils/fp'

import type { Config } from './config/Config'
import { constants } from './config/constants'
import { HttpClient } from './helpers/HttpClient'
import { JwtHelper } from './helpers/JwtHelper'
import { scheduleCronJob } from './helpers/scheduleCronJob'
import type { CronJobEvent } from './models/event/CronJobEvent'
import { LoggerGetter } from './models/logger/LoggerGetter'
import { MongoCollectionGetter } from './models/mongo/MongoCollection'
import { WithDb } from './models/mongo/WithDb'
import { ChampionMasteryPersistence } from './persistence/ChampionMasteryPersistence'
import { ChampionShardPersistence } from './persistence/ChampionShardPersistence'
import { HealthCheckPersistence } from './persistence/HealthCheckPersistence'
import { MigrationPersistence } from './persistence/MigrationPersistence'
import { RiotAccountPersistence } from './persistence/RiotAccountPersistence'
import { SummonerPersistence } from './persistence/SummonerPersistence'
import { UserPersistence } from './persistence/UserPersistence'
import { DDragonService } from './services/DDragonService'
import { DiscordService } from './services/DiscordService'
import { HealthCheckService } from './services/HealthCheckService'
import { MasteriesService } from './services/MasteriesService'
import { MigrationService } from './services/MigrationService'
import { RiotAccountService } from './services/RiotAccountService'
import { RiotApiService } from './services/RiotApiService'
import { SummonerService } from './services/SummonerService'
import { UserService } from './services/UserService'
import { getOnError } from './utils/getOnError'

type Context = Readonly<ReturnType<typeof of>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  config: Config,
  Logger: LoggerGetter,
  championMasteryPersistence: ChampionMasteryPersistence,
  championShardPersistence: ChampionShardPersistence,
  healthCheckPersistence: HealthCheckPersistence,
  riotAccountPersistence: RiotAccountPersistence,
  userPersistence: UserPersistence,
  discordService: DiscordService,
  riotApiService: RiotApiService,
  summonerService: SummonerService,
) => {
  const jwtHelper = JwtHelper(config.jwtSecret)

  const riotAccountService = RiotAccountService(
    riotAccountPersistence,
    riotApiService,
    summonerService,
  )

  const ddragonService = DDragonService(riotApiService)
  const healthCheckService = HealthCheckService(healthCheckPersistence)
  const masteriesService = MasteriesService(championMasteryPersistence, riotApiService)
  const userService = UserService(
    Logger,
    championShardPersistence,
    userPersistence,
    jwtHelper,
    discordService,
    riotAccountService,
    summonerService,
  )

  return {
    config,
    Logger,
    ddragonService,
    discordService,
    healthCheckService,
    summonerService,
    masteriesService,
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

  const championMasteryPersistence = ChampionMasteryPersistence(Logger, mongoCollection)
  const championShardPersistence = ChampionShardPersistence(Logger, mongoCollection)
  const healthCheckPersistence = HealthCheckPersistence(withDb)
  const migrationPersistence = MigrationPersistence(Logger, mongoCollection)
  const riotAccountPersistence = RiotAccountPersistence(Logger, mongoCollection)
  const summonerPersistence = SummonerPersistence(Logger, mongoCollection)
  const userPersistence = UserPersistence(Logger, mongoCollection)

  const httpClient = HttpClient(Logger)

  const discordService = DiscordService(config.client, httpClient)
  const riotApiService = RiotApiService(config.riot, httpClient)

  const cronJobPubSub = PubSub<CronJobEvent>()

  return pipe(
    apply.sequenceT(IO.ApplyPar)(
      SummonerService(Logger, riotApiService, summonerPersistence, cronJobPubSub.observable),
      scheduleCronJob(Logger, cronJobPubSub.subject),
    ),
    Future.fromIOEither,
    Future.chain(([summonerService]) => {
      const context = of(
        config,
        Logger,
        championMasteryPersistence,
        championShardPersistence,
        healthCheckPersistence,
        riotAccountPersistence,
        userPersistence,
        discordService,
        riotApiService,
        summonerService,
      )
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
            championMasteryPersistence.ensureIndexes,
            championShardPersistence.ensureIndexes,
            riotAccountPersistence.ensureIndexes,
            summonerPersistence.ensureIndexes,
            userPersistence.ensureIndexes,
          ]),
        ),
        Future.chainIOEitherK(() => logger.info('Ensured indexes')),
        Future.map(() => context),
      )
    }),
  )
}

const Context = { load }

export { Context }
