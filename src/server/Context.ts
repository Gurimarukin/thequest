import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'

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
import { HallOfFameMemberPersistence } from './persistence/HallOfFameMemberPersistence'
import { HealthCheckPersistence } from './persistence/HealthCheckPersistence'
import { LeagueEntryPersistence } from './persistence/LeagueEntryPersistence'
import { MatchPersistence } from './persistence/MatchPersistence'
import { MigrationPersistence } from './persistence/MigrationPersistence'
import { PoroActiveGamePersistence } from './persistence/PoroActiveGamePersistence'
import { RiotAccountPersistence } from './persistence/RiotAccountPersistence'
import { SummonerPersistence } from './persistence/SummonerPersistence'
import { UserPersistence } from './persistence/UserPersistence'
import { ActiveGameService } from './services/ActiveGameService'
import { ChallengesService } from './services/ChallengesService'
import { DDragonService } from './services/DDragonService'
import { DiscordService } from './services/DiscordService'
import { HallOfFameMemberService } from './services/HallOfFameMemberService'
import { HealthCheckService } from './services/HealthCheckService'
import { LeagueEntryService } from './services/LeagueEntryService'
import { MasteriesService } from './services/MasteriesService'
import { MatchService } from './services/MatchService'
import { MigrationService } from './services/MigrationService'
import { MockService } from './services/MockService'
import { PoroActiveGameService } from './services/PoroActiveGameService'
import { RiotAccountService } from './services/RiotAccountService'
import { RiotApiService } from './services/RiotApiService'
import { SummonerService } from './services/SummonerService'
import { UserService } from './services/UserService'
import { StaticDataService } from './services/staticDataService/StaticDataService'

const { prettyMs } = StringUtils

const dbRetryDelay = MsDuration.seconds(10)

type Context = ReturnType<typeof of>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  config: Config,
  Logger: LoggerGetter,
  challengesPersistence: ChallengesPersistence,
  matchPersistence: MatchPersistence,
  championMasteryPersistence: ChampionMasteryPersistence,
  championShardPersistence: ChampionShardPersistence,
  hallOfFameMemberPersistence: HallOfFameMemberPersistence,
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
  const hallOfFameMemberService = HallOfFameMemberService(hallOfFameMemberPersistence)
  const healthCheckService = HealthCheckService(healthCheckPersistence)
  const leagueEntryService = LeagueEntryService(
    config.riotApi.cacheTtl,
    leagueEntryPersistence,
    riotApiService,
  )
  const matchService = MatchService(matchPersistence, riotApiService)
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
    hallOfFameMemberService,
    matchService,
    masteriesService,
    poroActiveGameService,
    riotAccountService,
    staticDataService,
    summonerService,
    userService,
  }
}

const load = (config: Config): Future<Context> => {
  const Logger = LoggerGetter(config.logLevel)
  const logger = Logger('Context')

  return pipe(WithDb.load(config.db, logger, dbRetryDelay), Future.chain(loadBis))

  function loadBis(withDb: WithDb): Future<Context> {
    const mongoCollection: MongoCollectionGetter = MongoCollectionGetter.fromWithDb(withDb)

    const activeGamePersistence = ActiveGamePersistence(Logger, mongoCollection)
    const challengesPersistence = ChallengesPersistence(Logger, mongoCollection)
    const championMasteryPersistence = ChampionMasteryPersistence(Logger, mongoCollection)
    const championShardPersistence = ChampionShardPersistence(Logger, mongoCollection)
    const hallOfFameMemberPersistence = HallOfFameMemberPersistence(Logger, mongoCollection)
    const healthCheckPersistence = HealthCheckPersistence(withDb)
    const leagueEntryPersistence = LeagueEntryPersistence(Logger, mongoCollection)
    const matchPersistence = MatchPersistence(Logger, mongoCollection)
    const migrationPersistence = MigrationPersistence(Logger, mongoCollection)
    const poroActiveGamePersistence = PoroActiveGamePersistence(Logger, mongoCollection)
    const riotAccountPersistence = RiotAccountPersistence(Logger, mongoCollection)
    const summonerPersistence = SummonerPersistence(Logger, mongoCollection)
    const userPersistence = UserPersistence(Logger, mongoCollection)

    const httpClient = HttpClient(Logger)
    const mockService = MockService(Logger)

    const discordService = DiscordService(config.discordClient, httpClient)
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
          matchPersistence,
          championMasteryPersistence,
          championShardPersistence,
          hallOfFameMemberPersistence,
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

        return pipe(
          logger.info('Ensuring indexes'),
          Future.fromIOEither,
          Future.chain(() => dbHealthCheck()),
          Future.chain(() => migrationService.applyMigrations),
          Future.chain(() =>
            NonEmptyArray.sequence(Future.ApplicativeSeq)([
              activeGamePersistence.ensureIndexes,
              challengesPersistence.ensureIndexes,
              championMasteryPersistence.ensureIndexes,
              championShardPersistence.ensureIndexes,
              hallOfFameMemberPersistence.ensureIndexes,
              leagueEntryPersistence.ensureIndexes,
              matchPersistence.ensureIndexes,
              poroActiveGamePersistence.ensureIndexes,
              riotAccountPersistence.ensureIndexes,
              summonerPersistence.ensureIndexes,
              userPersistence.ensureIndexes,
            ]),
          ),
          Future.chainIOEitherK(() => logger.info('Ensured indexes')),
          Future.map(() => context),
        )

        function dbHealthCheck(): Future<boolean> {
          const check: Future<boolean> = pipe(
            pipe(
              healthCheckService.check(),
              Future.orElse(() =>
                pipe(
                  logger.info(
                    `Couldn't check health, waiting ${prettyMs(dbRetryDelay)} before next try`,
                  ),
                  Future.fromIOEither,
                  Future.chain(() => pipe(check, Future.delay(dbRetryDelay))),
                ),
              ),
            ),
          )

          return pipe(
            check,
            Future.filterOrElse(
              success => success,
              () => Error("HealthCheck wasn't success"),
            ),
          )
        }
      }),
    )
  }
}

const Context = { load }

export { Context }
