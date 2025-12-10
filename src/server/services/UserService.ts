import { apply, ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import readline from 'readline'

import { DayJs } from '../../shared/models/DayJs'
import { MsDuration } from '../../shared/models/MsDuration'
import type { Platform } from '../../shared/models/api/Platform'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import type { Token } from '../../shared/models/api/user/Token'
import { UserName } from '../../shared/models/api/user/UserName'
import { RiotId } from '../../shared/models/riot/RiotId'
import type { SummonerName } from '../../shared/models/riot/SummonerName'
import type { NonEmptyArray, NotUsed } from '../../shared/utils/fp'
import { Either, Future, IO, List, Maybe, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { JwtHelper } from '../helpers/JwtHelper'
import type { ChampionShardsLevel } from '../models/ChampionShardsLevel'
import type { DiscordConnection } from '../models/discord/DiscordConnection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { SummonerWithRiotId } from '../models/summoner/Summoner'
import { TokenContent } from '../models/user/TokenContent'
import { User } from '../models/user/User'
import type { UserDiscordInfos } from '../models/user/UserDiscordInfos'
import { UserId } from '../models/user/UserId'
import { UserLogin, UserLoginDiscord, UserLoginPassword } from '../models/user/UserLogin'
import type { ChampionShardPersistence } from '../persistence/ChampionShardPersistence'
import type { UserPersistence } from '../persistence/UserPersistence'
import { PasswordUtils } from '../utils/PasswordUtils'
import type { DiscordService } from './DiscordService'
import type { RiotAccountService } from './RiotAccountService'
import type { SummonerService } from './SummonerService'

const linkedRiotAccountPlatform: Platform = 'EUW'
const accountTokenTtl = MsDuration.days(30)

export type SummonerWithDiscordInfos = {
  summoner: {
    platform: Platform
    puuid: Puuid
    riotId: RiotId
    name: Maybe<SummonerName>
    profileIconId: number
  }
  discord: UserDiscordInfos
}

type ForceCacheRefresh = {
  forceCacheRefresh: boolean
}

type UserService = ReturnType<typeof UserService>

const UserService = (
  Logger: LoggerGetter,
  championShardPersistence: ChampionShardPersistence,
  userPersistence: UserPersistence,
  jwtHelper: JwtHelper,
  discordService: DiscordService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const logger = Logger('UserService')

  const { findById, addFavoriteSearch, removeFavoriteSearch, removeAllFavoriteSearches } =
    userPersistence

  const createUserPassword = (
    userName: UserName,
    password: ClearPassword,
  ): Future<Maybe<User<UserLoginPassword>>> =>
    pipe(
      userPersistence.findByLoginUserName(userName),
      Future.chain(
        Maybe.fold(
          () =>
            pipe(
              PasswordUtils.hash(password),
              Future.chainIOEitherK(hashed =>
                generateUser(UserLoginPassword.of(userName, hashed, Maybe.none)),
              ),
              Future.chain(user =>
                pipe(
                  userPersistence.create(user),
                  Future.map(success => (success ? Maybe.some(user) : Maybe.none)),
                ),
              ),
            ),
          () => futureMaybe.none,
        ),
      ),
    )

  const createUserInteractive: Future<NotUsed> = pipe(
    Future.fromIOEither(logger.info('Creating user')),
    Future.chain(() =>
      apply.sequenceT(Future.ApplySeq)(
        prompt('userName: '),
        prompt('password: '),
        prompt('confirm password: '),
      ),
    ),
    Future.chain(([userName, password, confirm]) =>
      password !== confirm
        ? Future.failed(Error('Passwords must be the same'))
        : pipe(
            createUserPassword(UserName(userName), ClearPassword(password)),
            Future.filterOrElse(Maybe.isSome, () => Error('Failed to create user')),
            Future.map(toNotUsed),
          ),
    ),
  )

  return {
    createUserPassword,
    createUserInteractive,

    verifyToken: (token: string): Future<TokenContent> =>
      jwtHelper.verify([TokenContent.codec, 'TokenContent'])(token),

    signToken,
    loginDiscord: (discord: UserDiscordInfos): Future<Maybe<Token>> =>
      pipe(
        userPersistence.findByLoginDiscordId(discord.id),
        Future.chain(
          Maybe.fold(
            () =>
              pipe(
                Future.fromIOEither(generateUser(UserLoginDiscord.of(discord))),
                Future.chain(user =>
                  pipe(
                    userPersistence.create(user),
                    Future.map(success => (success ? Maybe.some(user) : Maybe.none)),
                  ),
                ),
              ),
            user => {
              const login = UserLoginDiscord.of(discord)

              return pipe(
                userPersistence.updateLoginDiscord(user.id, login),
                Future.map(success => (success ? Maybe.some({ ...user, login }) : Maybe.none)),
              )
            },
          ),
        ),
        futureMaybe.chainTaskEitherK(user => signToken({ id: user.id, role: user.role })),
      ),
    loginPassword: (userName: UserName, clearPassword: ClearPassword): Future<Maybe<Token>> =>
      pipe(
        futureMaybe.Do,
        futureMaybe.apS('user', userPersistence.findByLoginUserName(userName)),
        futureMaybe.bind('validPassword', ({ user }) =>
          futureMaybe.fromTaskEither(PasswordUtils.check(user.login.password, clearPassword)),
        ),
        futureMaybe.filter(({ validPassword }) => validPassword),
        futureMaybe.chainTaskEitherK(({ user }) => signToken({ id: user.id, role: user.role })),
      ),

    findById,
    addFavoriteSearch,
    removeFavoriteSearch,
    removeAllFavoriteSearches,
    listChampionShardsForSummoner: championShardPersistence.listForSummoner,
    findChampionShardsForChampion: championShardPersistence.findForChampion,
    setChampionsShardsForSummonerBulk: (
      user: UserId,
      summoner: Puuid,
      champions: NonEmptyArray<ChampionShardsLevel>,
    ): Future<boolean> => {
      const { left: toUpsert, right: toDelete } = pipe(
        champions,
        List.partition(c => c.shardsCount === 0),
      )
      return championShardPersistence.bulkDeleteAndUpsert(user, summoner, { toDelete, toUpsert })
    },

    getLinkedRiotAccount:
      ({ forceCacheRefresh }: ForceCacheRefresh) =>
      (user: User<UserLogin>): Future<Maybe<SummonerWithDiscordInfos>> =>
        pipe(
          withRefreshDiscordToken(user)(discord =>
            pipe(
              discordService.users.me.connections.get(discord.accessToken),
              Future.map(List.findFirst(c => c.type === 'riotgames')),
              futureMaybe.chain(fetchRiotGamesAccount(discord, { forceCacheRefresh })),
              futureMaybe.map((summoner): SummonerWithDiscordInfos => ({ summoner, discord })),
            ),
          ),
          Maybe.getOrElseW(() => futureMaybe.none),
        ),
  }

  function fetchRiotGamesAccount(
    discord: UserDiscordInfos,
    { forceCacheRefresh }: ForceCacheRefresh,
  ): (riotGamesConnection: DiscordConnection) => Future<Maybe<SummonerWithRiotId>> {
    return riotGamesConnection =>
      pipe(
        RiotId.fromStringDecoder.decode(riotGamesConnection.name),
        Either.mapLeft(() =>
          Error(
            `Couldn't decode RiotId for user ${discord.username}#${discord.discriminator} (${discord.id}) - value: ${riotGamesConnection.name}`,
          ),
        ),
        Future.fromEither,
        Future.bindTo('riotId'),
        Future.chain(({ riotId }) => riotAccountService.findByRiotId(riotId)),
        futureMaybe.bind('summoner', ({ puuid }) =>
          summonerService.findByPuuid(linkedRiotAccountPlatform, puuid, { forceCacheRefresh }),
        ),
        futureMaybe.map(({ summoner, riotId }): SummonerWithRiotId => ({ ...summoner, riotId })),
      )
  }

  function signToken(content: TokenContent): Future<Token> {
    return jwtHelper.sign(TokenContent.codec)(content, { expiresIn: accountTokenTtl })
  }

  /**
   * Refreshes token if needed
   * @returns none if user hasn't linked to Discord account
   */
  function withRefreshDiscordToken(
    user: User<UserLogin>,
  ): <A>(f: (discord: UserDiscordInfos) => Future<A>) => Maybe<Future<A>> {
    return f =>
      pipe(
        UserLogin.discordInfos(user.login),
        Maybe.map(discord =>
          pipe(
            DayJs.now,
            Future.fromIO,
            Future.chain(now =>
              ord.lt(DayJs.Ord)(now, discord.expiresAt)
                ? f(discord)
                : pipe(refreshToken(user, discord), Future.chain(f)),
            ),
          ),
        ),
      )
  }

  function refreshToken(
    user: User<UserLogin>,
    discord: UserDiscordInfos,
  ): Future<UserDiscordInfos> {
    return pipe(
      discordService.oauth2.token.post.refreshToken(discord.refreshToken),
      Future.bindTo('oauth2'),
      Future.bind('now', () => Future.fromIO(DayJs.now)),
      Future.map(
        ({ oauth2, now }): UserDiscordInfos => ({
          id: discord.id,
          username: discord.username,
          discriminator: discord.discriminator,
          accessToken: oauth2.access_token,
          expiresAt: pipe(now, DayJs.add(oauth2.expires_in)),
          refreshToken: oauth2.refresh_token,
        }),
      ),
      Future.chainFirst(newDiscord =>
        pipe(
          userPersistence.updateLoginDiscord(
            user.id,
            pipe(user.login, UserLogin.setDiscordInfos(newDiscord)),
          ),
          Future.filterOrElse(
            success => success,
            () => Error(`Couldn't update user's login: ${user.id}`),
          ),
        ),
      ),
    )
  }
}

export { UserService }

function generateUser<A extends UserLogin>(login: A): IO<User<A>> {
  return pipe(
    UserId.generate,
    IO.map(id => User(id, login, [], 'base')),
  )
}

const prompt = (label: string): Future<string> =>
  pipe(
    Future.tryCatch(() => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
      return new Promise<string>(resolve => rl.question(label, answer => resolve(answer))).then(
        res => {
          // eslint-disable-next-line functional/no-expression-statements
          rl.close()
          return res
        },
      )
    }),
  )
