import { apply, ord } from 'fp-ts'
import type { Lazy } from 'fp-ts/function'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import * as D from 'io-ts/Decoder'

import { DayJs } from '../../shared/models/DayJs'
import { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'
import type { Platform } from '../../shared/models/api/Platform'
import { PlatformWithName } from '../../shared/models/api/summoner/PlatformWithName'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { DiscordCodePayload } from '../../shared/models/api/user/DiscordCodePayload'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import { Token } from '../../shared/models/api/user/Token'
import { UserView } from '../../shared/models/api/user/UserView'
import type { OAuth2Code } from '../../shared/models/discord/OAuth2Code'
import { Either, Future, List, Maybe, Tuple } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'
import { validateChampionShards } from '../../shared/validations/validateChampionShards'
import { validatePassword } from '../../shared/validations/validatePassword'

import { constants } from '../config/constants'
import type { PlatformWithPuuid } from '../models/PlatformWithPuuid'
import type { Summoner } from '../models/summoner/Summoner'
import type { TokenContent } from '../models/user/TokenContent'
import { User } from '../models/user/User'
import type { UserDiscordInfos } from '../models/user/UserDiscordInfos'
import { UserId } from '../models/user/UserId'
import { UserLogin } from '../models/user/UserLogin'
import type { DiscordService } from '../services/DiscordService'
import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'

type UserController = Readonly<ReturnType<typeof UserController>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserController(
  discordService: DiscordService,
  summonerService: SummonerService,
  masteriesService: MasteriesService,
  userService: UserService,
) {
  const loginDiscord: EndedMiddleware = EndedMiddleware.withBody(DiscordCodePayload.codec)(
    ({ code }) =>
      pipe(
        exchangeCodeAndGetUsersMe(code),
        Future.chain(userService.loginDiscord),
        M.fromTaskEither,
        M.ichain(
          Maybe.fold(
            () => M.sendWithStatus(Status.NotFound)('No account for Discord user'),
            sendToken,
          ),
        ),
      ),
  )

  const loginPassword: EndedMiddleware = EndedMiddleware.withBody(LoginPasswordPayload.codec)(
    ({ userName, password }) =>
      pipe(
        userService.loginPassword(userName, password),
        M.fromTaskEither,
        M.ichain(
          Maybe.fold(
            () => M.sendWithStatus(Status.NotFound)('Invalid userName/password'),
            sendToken,
          ),
        ),
      ),
  )

  const logout: EndedMiddleware = pipe(
    M.status(Status.NoContent),
    M.ichain(() => M.clearCookie(constants.account.cookie.name, {})),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send('')),
  )

  const registerDiscord: EndedMiddleware = EndedMiddleware.withBody(DiscordCodePayload.codec)(
    ({ code }) =>
      pipe(
        exchangeCodeAndGetUsersMe(code),
        Future.chain(userService.createUserDiscord),
        Future.map(Either.fromOption(() => 'Discord account already used')),
        futureEither.chainTaskEitherK(user => userService.signToken({ id: user.id })),
        M.fromTaskEither,
        M.ichain(Either.fold(M.sendWithStatus(Status.BadRequest), sendToken)),
      ),
  )

  const registerPassword: EndedMiddleware = EndedMiddleware.withBody(LoginPasswordPayload.codec)(
    flow(
      Either.right,
      Either.bind('validatedPassword', ({ password }) => validatePassword(password)),
      Future.right,
      futureEither.chain(({ userName, validatedPassword }) =>
        pipe(
          userService.createUserPassword(userName, validatedPassword),
          Future.map(Either.fromOption(() => 'User name already used')),
        ),
      ),
      futureEither.chainTaskEitherK(user => userService.signToken({ id: user.id })),
      M.fromTaskEither,
      M.ichain(Either.fold(M.sendWithStatus(Status.BadRequest), sendToken)),
    ),
  )

  return {
    getSelf: (user: TokenContent): EndedMiddleware =>
      pipe(
        userService.findById(user.id),
        Future.map(Either.fromOption(() => 'User not found')),
        futureEither.chainTaskEitherK(u =>
          apply.sequenceS(Future.ApplyPar)({
            userName: Future.right(User.userName(u)),
            favoriteSearches: fetchFavoriteSearches(u.favoriteSearches),
            linkedRiotAccount: fetchLinkedRiotAccount(u),
          }),
        ),
        M.fromTaskEither,
        M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(UserView.codec))),
      ),

    addFavoriteSelf: favoriteSelf(
      userService.addFavoriteSearch,
      () => 'Summoner search is already in favorites',
    ),

    removeFavoriteSelf: favoriteSelf(
      userService.removeFavoriteSearch,
      () => 'Summoner search is not in favorites',
    ),

    setSummonerChampionShardsCount:
      (platform: Platform, summonerName: string, champion: ChampionKey) =>
      (user: TokenContent): EndedMiddleware =>
        EndedMiddleware.withBody(D.number)(count => {
          const res = pipe(
            validateChampionShards(count),
            Either.mapLeft(() => Tuple.of(Status.BadRequest, 'Invalid shards count')),
            Future.right,
            futureEither.bindTo('validatedCount'),
            futureEither.bind('summoner', () =>
              pipe(
                summonerService.findByName(platform, summonerName),
                Future.map(
                  Either.fromOption(() => Tuple.of(Status.NotFound, 'Summoner not found')),
                ),
              ),
            ),
            futureEither.bind('championLevel', ({ summoner }) =>
              pipe(
                masteriesService.findBySummoner(platform, summoner.id),
                futureMaybe.map(
                  flow(
                    List.findFirst(m => ChampionKey.Eq.equals(m.championId, champion)),
                    Maybe.map(m => m.championLevel),
                    Maybe.getOrElse<ChampionLevelOrZero>(() => 0),
                  ),
                ),
                Future.map(
                  Either.fromOption(() => Tuple.of(Status.NotFound, 'Masteries not found')),
                ),
              ),
            ),
            futureEither.chain(({ validatedCount, summoner, championLevel }) =>
              pipe(
                userService.setChampionShardsForSummoner(
                  user.id,
                  summoner.id,
                  champion,
                  validatedCount,
                  championLevel,
                ),
                Future.map(
                  (success): Either<Tuple<Status, string>, Tuple<Status, string>> =>
                    success
                      ? Either.right(Tuple.of(Status.NoContent, ''))
                      : Either.left(Tuple.of(Status.InternalServerError, '')),
                ),
              ),
            ),
            M.fromTaskEither,
            M.ichain(
              flow(
                Either.getOrElse(e => e),
                ([status, message]) => M.sendWithStatus(status)(message),
              ),
            ),
          )
          return res
        }),

    loginDiscord,
    loginPassword,
    logout,
    registerDiscord,
    registerPassword,
  }

  function sendToken(token: Token): EndedMiddleware {
    return pipe(
      M.status(Status.NoContent),
      M.ichain(() =>
        M.cookie(constants.account.cookie.name, Token.codec.encode(token), {
          maxAge: constants.account.cookie.ttl,
          httpOnly: true,
          sameSite: 'strict',
        }),
      ),
      M.ichain(() => M.closeHeaders()),
      M.ichain(() => M.send('')),
    )
  }

  function exchangeCodeAndGetUsersMe(code: OAuth2Code): Future<UserDiscordInfos> {
    return pipe(
      Future.Do,
      Future.apS('oauth2', discordService.oauth2.token.post.authorizationCode(code)),
      Future.bind('now', () => Future.fromIO(DayJs.now)),
      Future.bind('user', ({ oauth2 }) => discordService.users.me.get(oauth2.access_token)),
      Future.map(({ oauth2, now, user }) => ({
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        accessToken: oauth2.access_token,
        expiresAt: pipe(now, DayJs.add(oauth2.expires_in)),
        refreshToken: oauth2.refresh_token,
      })),
    )
  }

  function fetchFavoriteSearches(
    favoriteSearches: List<PlatformWithPuuid>,
  ): Future<List<SummonerShort>> {
    return pipe(
      favoriteSearches,
      List.traverse(Future.ApplicativePar)(({ platform, puuid }) =>
        pipe(
          summonerService.findByPuuid(platform, puuid),
          Future.map(
            Maybe.fold<Summoner, Either<PlatformWithPuuid, SummonerShort>>(
              () => Either.left({ platform, puuid }),
              summoner => Either.right({ ...summoner, platform }),
            ),
          ),
        ),
      ),
      Future.chain(eithers => {
        const { left, right } = List.separate(eithers)
        if (!List.isNonEmpty(left)) return Future.right(right)
        return pipe(
          apply.sequenceT(Future.ApplyPar)(
            userService.removeAllFavoriteSearches(left),
            summonerService.deleteByPlatformAndPuuid(left),
          ),
          Future.map(() => right),
        )
      }),
    )
  }

  function fetchLinkedRiotAccount(user: User<UserLogin>): Future<Maybe<PlatformWithName>> {
    return pipe(
      withRefreshDiscordToken(user)(discord =>
        discordService.users.me.connections.get(discord.accessToken),
      ),
      Maybe.fold(() => futureMaybe.none, Future.map(Maybe.some)),
      futureMaybe.chainOptionK(List.findFirst(c => c.type === 'riotgames')),
      futureMaybe.chainEitherK(c =>
        pipe(
          PlatformWithName.fromStringDecoder.decode(c.name),
          Either.mapLeft(decodeError('PlatformWithNameFromString')(c.name)),
        ),
      ),
    )
  }

  function favoriteSelf(
    updateFavoriteSearch: (id: UserId, search: PlatformWithPuuid) => Future<Maybe<boolean>>,
    uselessActionMessage: Lazy<string>,
  ): (user: TokenContent) => EndedMiddleware {
    return user =>
      EndedMiddleware.withBody(PlatformWithName.codec)(({ platform, name }) =>
        pipe(
          summonerService.findByName(platform, name),
          Future.map(Either.fromOption(() => 'Summoner not found')),
          futureEither.chain(({ puuid }) =>
            pipe(
              updateFavoriteSearch(user.id, { platform, puuid }),
              Future.map(Either.fromOption(() => 'User not found')),
            ),
          ),
          M.fromTaskEither,
          M.ichain(
            Either.fold(M.sendWithStatus(Status.NotFound), removed =>
              removed ? M.noContent() : M.sendWithStatus(Status.BadRequest)(uselessActionMessage()),
            ),
          ),
        ),
      )
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
          userService.updateLoginDiscord(
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

export { UserController }
