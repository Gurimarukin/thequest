import { apply, ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import readline from 'readline'

import { DayJs } from '../../shared/models/DayJs'
import { Platform } from '../../shared/models/api/Platform'
import { PlatformWithName } from '../../shared/models/api/summoner/PlatformWithName'
import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import type { Token } from '../../shared/models/api/user/Token'
import { UserName } from '../../shared/models/api/user/UserName'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import type { NonEmptyArray, NotUsed } from '../../shared/utils/fp'
import { Either, Future, List, Maybe, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { JwtHelper } from '../helpers/JwtHelper'
import type { ChampionShardsLevel } from '../models/ChampionShardsLevel'
import type { DiscordConnection } from '../models/discord/DiscordConnection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { SummonerId } from '../models/summoner/SummonerId'
import { TokenContent } from '../models/user/TokenContent'
import { User } from '../models/user/User'
import type { UserDiscordInfos } from '../models/user/UserDiscordInfos'
import { UserId } from '../models/user/UserId'
import { UserLogin, UserLoginDiscord, UserLoginPassword } from '../models/user/UserLogin'
import type { ChampionShardPersistence } from '../persistence/ChampionShardPersistence'
import type { UserPersistence } from '../persistence/UserPersistence'
import { PasswordUtils } from '../utils/PasswordUtils'
import type { DiscordService } from './DiscordService'

type RiotAccountWithDiscordInfos = {
  readonly riotAccount: PlatformWithName
  readonly discord: UserDiscordInfos
}

type UserService = Readonly<ReturnType<typeof UserService>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserService(
  Logger: LoggerGetter,
  championShardPersistence: ChampionShardPersistence,
  userPersistence: UserPersistence,
  jwtHelper: JwtHelper,
  discordService: DiscordService,
) {
  const logger = Logger('UserService')

  const {
    findAllByLoginDiscordId,
    findById,
    addFavoriteSearch,
    removeFavoriteSearch,
    removeAllFavoriteSearches,
  } = userPersistence

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
              apply.sequenceS(Future.ApplyPar)({
                id: Future.fromIOEither(UserId.generate),
                hashed: PasswordUtils.hash(password),
              }),
              Future.chain(({ id, hashed }) => {
                const user = User.of(
                  id,
                  UserLoginPassword.of(userName, hashed, Maybe.none),
                  List.empty,
                )
                return pipe(
                  userPersistence.create(user),
                  Future.map(success => (success ? Maybe.some(user) : Maybe.none)),
                )
              }),
            ),
          () => futureMaybe.none,
        ),
      ),
    )

  const createUserInteractive: Future<NotUsed> = pipe(
    Future.fromIOEither(logger.info('Creating user')),
    Future.chain(() =>
      apply.sequenceT(Future.taskEitherSeq)(
        prompt('userName: '),
        prompt('password: '),
        prompt('confirm password: '),
      ),
    ),
    Future.chain(([userName, password, confirm]) =>
      password !== confirm
        ? Future.left(Error('Passwords must be the same'))
        : pipe(
            createUserPassword(UserName.wrap(userName), ClearPassword.wrap(password)),
            Future.filterOrElse(Maybe.isSome, () => Error('Failed to create user')),
            Future.map(toNotUsed),
          ),
    ),
  )

  return {
    createUserDiscord: (discord: UserDiscordInfos): Future<Maybe<User<UserLoginDiscord>>> =>
      pipe(
        userPersistence.findByLoginDiscordId(discord.id),
        Future.chain(
          Maybe.fold(
            () =>
              pipe(
                Future.fromIOEither(UserId.generate),
                Future.chain(id => {
                  const user = User.of(id, UserLoginDiscord.of(discord), List.empty)
                  return pipe(
                    userPersistence.create(user),
                    Future.map(success => (success ? Maybe.some(user) : Maybe.none)),
                  )
                }),
              ),
            () => futureMaybe.none,
          ),
        ),
      ),
    createUserPassword,
    createUserInteractive,

    verifyToken: (token: string): Future<TokenContent> =>
      jwtHelper.verify([TokenContent.codec, 'TokenContent'])(token),

    signToken,
    loginDiscord: (login: UserDiscordInfos): Future<Maybe<Token>> =>
      pipe(
        futureMaybe.Do,
        futureMaybe.apS('user', userPersistence.findByLoginDiscordId(login.id)),
        futureMaybe.bind('updated', ({ user }) =>
          futureMaybe.fromTaskEither(
            userPersistence.updateLoginDiscord(user.id, UserLoginDiscord.of(login)),
          ),
        ),
        futureMaybe.filter(({ updated }) => updated),
        futureMaybe.chainTaskEitherK(({ user }) => signToken({ id: user.id })),
      ),
    loginPassword: (userName: UserName, clearPassword: ClearPassword): Future<Maybe<Token>> =>
      pipe(
        futureMaybe.Do,
        futureMaybe.apS('user', userPersistence.findByLoginUserName(userName)),
        futureMaybe.bind('validPassword', ({ user }) =>
          futureMaybe.fromTaskEither(PasswordUtils.check(user.login.password, clearPassword)),
        ),
        futureMaybe.filter(({ validPassword }) => validPassword),
        futureMaybe.chainTaskEitherK(({ user }) => signToken({ id: user.id })),
      ),

    findAllByLoginDiscordId,
    findById,
    addFavoriteSearch,
    removeFavoriteSearch,
    removeAllFavoriteSearches,
    listChampionShardsForSummoner: championShardPersistence.listForSummoner,
    setChampionsShardsForSummonerBulk: (
      user: UserId,
      summoner: SummonerId,
      champions: NonEmptyArray<ChampionShardsLevel>,
    ): Future<boolean> => {
      const { left: toUpsert, right: toDelete } = pipe(
        champions,
        List.partition(c => c.shardsCount === 0),
      )
      return championShardPersistence.bulkDeleteAndUpsert(user, summoner, { toDelete, toUpsert })
    },

    getLinkedRiotAccount: (user: User<UserLogin>): Future<Maybe<RiotAccountWithDiscordInfos>> =>
      pipe(
        withRefreshDiscordToken(user)(discord =>
          pipe(
            discordService.users.me.connections.get(discord.accessToken),
            Future.chain(connections =>
              pipe(
                platformWithNameFromRiotGames(discord, connections),
                futureMaybe.alt(() => platformWithNameFromLeagueOfLegends(connections)),
              ),
            ),
            futureMaybe.map(
              (riotAccount): RiotAccountWithDiscordInfos => ({ riotAccount, discord }),
            ),
          ),
        ),
        Maybe.getOrElseW(() => futureMaybe.none),
      ),
  }

  // name can be either `<summonerName>#<platform>` (from LoL) or `<gameName>#<tagLine>` (from Riot account)
  function platformWithNameFromRiotGames(
    discord: UserDiscordInfos,
    connections: List<DiscordConnection>,
  ): Future<Maybe<PlatformWithName>> {
    return pipe(
      connections,
      List.findFirst(c => c.type === 'riotgames'),
      futureMaybe.fromOption,
      futureMaybe.chain(c =>
        pipe(
          PlatformWithName.fromStringDecoder.decode(c.name),
          Either.fold(
            () =>
              pipe(
                logger.warn(
                  `"riotgames" connection: couldn't decode <summonerName>#<platform> for user ${
                    discord.username
                  }#${discord.discriminator} (${DiscordUserId.unwrap(discord.id)}) - value: ${
                    c.name
                  }\nFalling back to "leagueoflegends", with default platform ${
                    Platform.defaultPlatform
                  }`,
                ),
                Future.fromIOEither,
                Future.map(() => Maybe.none),
              ),
            futureMaybe.some,
          ),
        ),
      ),
    )
  }

  function platformWithNameFromLeagueOfLegends(
    connections: List<DiscordConnection>,
  ): Future<Maybe<PlatformWithName>> {
    return pipe(
      connections,
      List.findFirstMap(c =>
        c.type === 'riotgames'
          ? Maybe.some<PlatformWithName>({ platform: Platform.defaultPlatform, name: c.name })
          : Maybe.none,
      ),
      futureMaybe.fromOption,
    )
  }

  function signToken(content: TokenContent): Future<Token> {
    return jwtHelper.sign(TokenContent.codec)(content, { expiresIn: constants.account.tokenTtl })
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
            () => Error(`Couldn't update user's login: ${UserId.unwrap(user.id)}`),
          ),
        ),
      ),
    )
  }
}

export { UserService }

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
