import { apply } from 'fp-ts'
import type { Lazy } from 'fp-ts/function'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { DayJs } from '../../shared/models/DayJs'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'
import { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import { ChampionShardsPayload } from '../../shared/models/api/summoner/ChampionShardsPayload'
import { PlatformWithName } from '../../shared/models/api/summoner/PlatformWithName'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { DiscordCodePayload } from '../../shared/models/api/user/DiscordCodePayload'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import { Token } from '../../shared/models/api/user/Token'
import { UserName } from '../../shared/models/api/user/UserName'
import { UserView } from '../../shared/models/api/user/UserView'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import type { OAuth2Code } from '../../shared/models/discord/OAuth2Code'
import { Dict, Either, Future, List, Maybe, NonEmptyArray, Tuple } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { validatePassword } from '../../shared/validations/validatePassword'

import { constants } from '../config/constants'
import type { ChampionShardsLevel } from '../models/ChampionShardsLevel'
import type { PlatformWithPuuid } from '../models/PlatformWithPuuid'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { Summoner } from '../models/summoner/Summoner'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { TokenContent } from '../models/user/TokenContent'
import { User } from '../models/user/User'
import type { UserDiscordInfos } from '../models/user/UserDiscordInfos'
import type { UserId } from '../models/user/UserId'
import type { DDragonService } from '../services/DDragonService'
import type { DiscordService } from '../services/DiscordService'
import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'

type UserController = Readonly<ReturnType<typeof UserController>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserController(
  Logger: LoggerGetter,
  ddragonService: DDragonService,
  discordService: DiscordService,
  summonerService: SummonerService,
  masteriesService: MasteriesService,
  userService: UserService,
) {
  const logger = Logger('UserController')

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
        Future.chainFirstIOEitherK(() =>
          logger.info(`Login/password user created: ${UserName.unwrap(userName)}`),
        ),
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
        Future.chain(discord =>
          pipe(
            userService.createUserDiscord(discord),
            Future.map(Either.fromOption(() => 'Discord account already used')),
            futureEither.chainTaskEitherK(user => userService.signToken({ id: user.id })),
            Future.chainFirstIOEitherK(() =>
              logger.info(
                `Discord user created: ${discord.username}#${
                  discord.discriminator
                } (${DiscordUserId.unwrap(discord.id)})`,
              ),
            ),
          ),
        ),
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
            linkedRiotAccount: pipe(
              userService.getLinkedRiotAccount({ forceCacheRefresh: false })(u),
              futureMaybe.chainOptionK(Maybe.fromEither),
              futureMaybe.map(a => a.summoner),
            ),
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

    setSummonerChampionsShardsCount,

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
              Either.right,
            ),
          ),
        ),
      ),
      Future.chain(eithers => {
        const { left, right } = List.separate(eithers)
        return pipe(
          apply.sequenceT(Future.ApplyPar)(
            userService.removeAllFavoriteSearches(left),
            summonerService.deleteByPuuid(left),
          ),
          Future.map(() => right),
        )
      }),
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

  function setSummonerChampionsShardsCount(
    platform: Platform,
    summonerName: string,
  ): (user: TokenContent) => EndedMiddleware {
    return user =>
      EndedMiddleware.withBody(NonEmptyArray.decoder(ChampionShardsPayload.codec))(championShards =>
        pipe(
          validateChampionKeys(championShards),
          Future.map(
            Either.mapLeft(invalidChampionKeys =>
              Tuple.of(
                Status.BadRequest,
                pipe(
                  invalidChampionKeys,
                  List.map(ChampionKey.fromStringCodec.encode),
                  List.mkString('Invalid champion keys:', ', ', ''),
                ),
              ),
            ),
          ),
          futureEither.bindTo('validatedChampionShards'),
          futureEither.bind('summoner', () =>
            pipe(
              summonerService.findByName(platform, summonerName),
              Future.map(Either.fromOption(() => Tuple.of(Status.NotFound, 'Summoner not found'))),
            ),
          ),
          futureEither.bind('championShardsLevel', ({ validatedChampionShards, summoner }) =>
            pipe(
              getChampionShardsLevel(platform, summoner.id, validatedChampionShards),
              Future.map(Either.fromOption(() => Tuple.of(Status.NotFound, 'Masteries not found'))),
            ),
          ),
          futureEither.chain(({ summoner, championShardsLevel }) =>
            pipe(
              userService.setChampionsShardsForSummonerBulk(
                user.id,
                summoner.id,
                championShardsLevel,
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
        ),
      )
  }

  function validateChampionKeys(
    championShards: NonEmptyArray<ChampionShardsPayload>,
  ): Future<ValidatedNea<ChampionKey, NonEmptyArray<ChampionShardsPayload>>> {
    return pipe(
      ddragonService.latestDataChampions(Lang.defaultLang),
      Future.map(({ champions: dataChampions }) => {
        const validChampionKeys = pipe(
          dataChampions.data,
          Dict.toReadonlyArray,
          List.map(([, { key }]) => key),
        )
        return pipe(
          championShards,
          List.filterMap(({ championId }) =>
            List.elem(ChampionKey.Eq)(championId, validChampionKeys)
              ? Maybe.none
              : Maybe.some(championId),
          ),
          NonEmptyArray.fromReadonlyArray,
          Maybe.foldW(() => ValidatedNea.valid(championShards), ValidatedNea.invalid),
        )
      }),
    )
  }

  function getChampionShardsLevel(
    platform: Platform,
    summonerId: SummonerId,
    validatedChampionShards: NonEmptyArray<ChampionShardsPayload>,
  ): Future<Maybe<NonEmptyArray<ChampionShardsLevel>>> {
    return pipe(
      masteriesService.findBySummoner(platform, summonerId),
      futureMaybe.map(masteries =>
        pipe(
          validatedChampionShards,
          NonEmptyArray.map(({ championId, shardsCount }) => ({
            championId,
            shardsCount,
            championLevel: pipe(
              masteries,
              List.findFirst(m => ChampionKey.Eq.equals(m.championId, championId)),
              Maybe.map(m => m.championLevel),
              Maybe.getOrElse<ChampionLevelOrZero>(() => 0),
            ),
          })),
        ),
      ),
    )
  }
}

export { UserController }
