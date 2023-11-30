import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { MongoClient } from 'mongodb'

import { MsDuration } from '../shared/models/MsDuration'
import { PubSub } from '../shared/models/rx/PubSub'
import { StringUtils } from '../shared/utils/StringUtils'
import { Future, IO, NonEmptyArray } from '../shared/utils/fp'

import type { Config } from './config/Config'
import { HttpClient } from './helpers/HttpClient'
import { JwtHelper } from './helpers/JwtHelper'
import { scheduleCronJob } from './helpers/scheduleCronJob'
import type { CronJobEvent } from './models/event/CronJobEvent'
import { LoggerGetter } from './models/logger/LoggerGetter'
import { MongoCollectionGetter } from './models/mongo/MongoCollection'
import { WithDb } from './models/mongo/WithDb'
import { ActiveGamePersistence } from './persistence/ActiveGamePersistence'
import { ChallengesPersistence } from './persistence/ChallengesPersistence'
import { ChampionMasteryPersistence } from './persistence/ChampionMasteryPersistence'
import { ChampionShardPersistence } from './persistence/ChampionShardPersistence'
import { HealthCheckPersistence } from './persistence/HealthCheckPersistence'
import { LeagueEntryPersistence } from './persistence/LeagueEntryPersistence'
import { MigrationPersistence } from './persistence/MigrationPersistence'
import { PoroActiveGamePersistence } from './persistence/PoroActiveGamePersistence'
import { RiotAccountPersistence } from './persistence/RiotAccountPersistence'
import { SummonerPersistence } from './persistence/SummonerPersistence'
import { UserPersistence } from './persistence/UserPersistence'
import { ActiveGameService } from './services/ActiveGameService'
import { ChallengesService } from './services/ChallengesService'
import { DDragonService } from './services/DDragonService'
import { DiscordService } from './services/DiscordService'
import { HealthCheckService } from './services/HealthCheckService'
import { LeagueEntryService } from './services/LeagueEntryService'
import { MasteriesService } from './services/MasteriesService'
import { MigrationService } from './services/MigrationService'
import { MockService } from './services/MockService'
import { PoroActiveGameService } from './services/PoroActiveGameService'
import { RiotAccountService } from './services/RiotAccountService'
import { RiotApiService } from './services/RiotApiService'
import { SummonerService } from './services/SummonerService'
import { UserService } from './services/UserService'
import { StaticDataService } from './services/staticDataService/StaticDataService'

const dbRetryDelay = MsDuration.seconds(10)

type Context = ReturnType<typeof of>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  config: Config,
  Logger: LoggerGetter,
  challengesPersistence: ChallengesPersistence,
  championMasteryPersistence: ChampionMasteryPersistence,
  championShardPersistence: ChampionShardPersistence,
  healthCheckPersistence: HealthCheckPersistence,
  leagueEntryPersistence: LeagueEntryPersistence,
  riotAccountPersistence: RiotAccountPersistence,
  userPersistence: UserPersistence,
  activeGameService: ActiveGameService,
  ddragonService: DDragonService,
  discordService: DiscordService,
  poroActiveGameService: PoroActiveGameService,
  riotApiService: RiotApiService,
  staticDataService: StaticDataService,
  summonerService: SummonerService,
) => {
  const jwtHelper = JwtHelper(config.jwtSecret)

  const riotAccountService = RiotAccountService(
    config.riotApi.cacheTtl,
    riotAccountPersistence,
    riotApiService,
  )

  const challengesService = ChallengesService(
    config.riotApi.cacheTtl,
    challengesPersistence,
    riotApiService,
  )
  const healthCheckService = HealthCheckService(healthCheckPersistence)
  const leagueEntryService = LeagueEntryService(
    config.riotApi.cacheTtl,
    leagueEntryPersistence,
    riotApiService,
  )
  const masteriesService = MasteriesService(
    config.riotApi.cacheTtl,
    championMasteryPersistence,
    riotApiService,
  )
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
    activeGameService,
    challengesService,
    ddragonService,
    discordService,
    healthCheckService,
    leagueEntryService,
    masteriesService,
    poroActiveGameService,
    riotAccountService,
    staticDataService,
    summonerService,
    userService,
  }
}

const load = (config: Config): Future<Context> =>
  pipe(
    Future.tryCatch(() =>
      new MongoClient(
        `mongodb://${config.db.user}:${config.db.password}@${config.db.host}`,
      ).connect(),
    ),
    Future.chain(loadBis(config)),
  )

const loadBis =
  (config: Config) =>
  (client: MongoClient): Future<Context> => {
    const Logger = LoggerGetter(config.logLevel)
    const logger = Logger('Context')

    const withDb = WithDb.of(client, config.db.dbName)

    const mongoCollection: MongoCollectionGetter = MongoCollectionGetter.fromWithDb(withDb)

    const activeGamePersistence = ActiveGamePersistence(Logger, mongoCollection)
    const challengesPersistence = ChallengesPersistence(Logger, mongoCollection)
    const championMasteryPersistence = ChampionMasteryPersistence(Logger, mongoCollection)
    const championShardPersistence = ChampionShardPersistence(Logger, mongoCollection)
    const healthCheckPersistence = HealthCheckPersistence(withDb)
    const leagueEntryPersistence = LeagueEntryPersistence(Logger, mongoCollection)
    const poroActiveGamePersistence = PoroActiveGamePersistence(Logger, mongoCollection)
    const migrationPersistence = MigrationPersistence(Logger, mongoCollection)
    const riotAccountPersistence = RiotAccountPersistence(Logger, mongoCollection)
    const summonerPersistence = SummonerPersistence(Logger, mongoCollection)
    const userPersistence = UserPersistence(Logger, mongoCollection)

    const httpClient = HttpClient(Logger)
    const mockService = MockService(Logger)

    const discordService = DiscordService(config.client, httpClient)
    const riotApiService = RiotApiService(config, httpClient, mockService)

    const ddragonService = DDragonService(config.riotApi.cacheTtl, riotApiService)

    const staticDataService = StaticDataService(
      config,
      Logger,
      httpClient,
      ddragonService,
      mockService,
    )

    const cronJobPubSub = PubSub<CronJobEvent>()

    return pipe(
      apply.sequenceT(IO.ApplyPar)(
        ActiveGameService(
          config.riotApi.cacheTtl,
          Logger,
          activeGamePersistence,
          riotApiService,
          cronJobPubSub.observable,
        ),
        PoroActiveGameService(
          config.poroApi,
          Logger,
          poroActiveGamePersistence,
          httpClient,
          cronJobPubSub.observable,
        ),
        SummonerService(
          config.riotApi.cacheTtl,
          Logger,
          summonerPersistence,
          riotApiService,
          cronJobPubSub.observable,
        ),
        scheduleCronJob(Logger, cronJobPubSub.subject),
      ),
      Future.fromIOEither,
      Future.chain(([activeGameService, poroActiveGameService, summonerService]) => {
        const context = of(
          config,
          Logger,
          challengesPersistence,
          championMasteryPersistence,
          championShardPersistence,
          healthCheckPersistence,
          leagueEntryPersistence,
          riotAccountPersistence,
          userPersistence,
          activeGameService,
          ddragonService,
          discordService,
          poroActiveGameService,
          riotApiService,
          staticDataService,
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
                  dbRetryDelay,
                )} before next try`,
              ),
              Future.fromIOEither,
              Future.chain(() => pipe(waitDatabaseReady, Future.delay(dbRetryDelay))),
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
              activeGamePersistence.ensureIndexes,
              challengesPersistence.ensureIndexes,
              championMasteryPersistence.ensureIndexes,
              championShardPersistence.ensureIndexes,
              leagueEntryPersistence.ensureIndexes,
              poroActiveGamePersistence.ensureIndexes,
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
