import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { DayJs } from '../../shared/models/DayJs'
import { MsDuration } from '../../shared/models/MsDuration'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import type { Platform } from '../../shared/models/api/Platform'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionShard } from '../../shared/models/api/summoner/ChampionShardsPayload'
import { ChampionShardsPayload } from '../../shared/models/api/summoner/ChampionShardsPayload'
import { PlatformWithPuuid } from '../../shared/models/api/summoner/PlatformWithPuuid'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { DiscordCodePayload } from '../../shared/models/api/user/DiscordCodePayload'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import { Token } from '../../shared/models/api/user/Token'
import { UserView } from '../../shared/models/api/user/UserView'
import type { OAuth2Code } from '../../shared/models/discord/OAuth2Code'
import { DictUtils } from '../../shared/utils/DictUtils'
import { ListUtils } from '../../shared/utils/ListUtils'
import { Either, Future, List, Maybe, NonEmptyArray, Tuple } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { validatePassword } from '../../shared/validations/validatePassword'

import { constants } from '../config/constants'
import type { ChampionShardsLevel } from '../models/ChampionShardsLevel'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { TokenContent } from '../models/user/TokenContent'
import { User } from '../models/user/User'
import type { UserDiscordInfos } from '../models/user/UserDiscordInfos'
import type { UserId } from '../models/user/UserId'
import type { DDragonService } from '../services/DDragonService'
import type { DiscordService } from '../services/DiscordService'
import type { MasteriesService } from '../services/MasteriesService'
import type { RiotAccountService } from '../services/RiotAccountService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'

const accountCookieTtl = MsDuration.days(30)

type UserController = ReturnType<typeof UserController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserController(
  Logger: LoggerGetter,
  ddragonService: DDragonService,
  discordService: DiscordService,
  masteriesService: MasteriesService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
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
        Future.chainFirstIOEitherK(() => logger.info(`Login/password user created: ${userName}`)),
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
    M.ichain(() => M.clearCookie(constants.accountCookieName, {})),
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
                `Discord user created: ${discord.username}#${discord.discriminator} (${discord.id})`,
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
      Future.successful,
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
            userName: Future.successful(User.userName(u)),
            favoriteSearches: fetchFavoriteSearches(u.id, u.favoriteSearches),
            linkedRiotAccount: pipe(
              userService.getLinkedRiotAccount({ forceCacheRefresh: false })(u),
              futureMaybe.map(a => a.summoner),
            ),
          }),
        ),
        M.fromTaskEither,
        M.ichain(Either.fold(M.sendWithStatus(Status.NotFound), M.json(UserView.codec))),
      ),

    addFavoriteSelf: (user_: TokenContent): EndedMiddleware =>
      EndedMiddleware.withBody(PlatformWithPuuid.codec)(({ platform, puuid }) =>
        pipe(
          userService.findById(user_.id),
          Future.map(Either.fromOption(() => 'User not found')),
          futureEither.chainTaskEitherK(
            userService.getLinkedRiotAccount({ forceCacheRefresh: false }),
          ),
          futureEither.bindTo('linkedRiotAccount'),
          futureEither.bind('summonerToFavorite', () =>
            pipe(
              summonerService.findByPuuid(platform, puuid),
              Future.map(Either.fromOption(() => 'Summoner not found')),
            ),
          ),
          futureEither.chain(({ linkedRiotAccount, summonerToFavorite }) => {
            const addFavoriteSearch = futureEither.fromTaskEither<string, Maybe<boolean>>(
              userService.addFavoriteSearch(user_.id, {
                platform: summonerToFavorite.platform,
                puuid: summonerToFavorite.puuid,
              }),
            )
            return pipe(
              linkedRiotAccount,
              Maybe.fold(
                () => addFavoriteSearch,
                ({ summoner: summonerSelf }) =>
                  Puuid.Eq.equals(summonerToFavorite.puuid, summonerSelf.puuid)
                    ? futureEither.left('')
                    : addFavoriteSearch,
              ),
            )
          }),
          Future.map(Either.chain(Either.fromOption(() => 'User not found'))),
          M.fromTaskEither,
          M.ichain(
            Either.fold(M.sendWithStatus(Status.NotFound), removed =>
              removed
                ? M.noContent()
                : M.sendWithStatus(Status.BadRequest)('Summoner search is already in favorites'),
            ),
          ),
        ),
      ),

    removeFavoriteSelf: (user: TokenContent): EndedMiddleware =>
      EndedMiddleware.withBody(Puuid.codec)(puuid =>
        pipe(
          pipe(
            userService.removeFavoriteSearch(user.id, puuid),
            Future.map(Either.fromOption(() => 'User not found')),
          ),
          M.fromTaskEither,
          M.ichain(
            Either.fold(M.sendWithStatus(Status.NotFound), removed =>
              removed
                ? M.noContent()
                : M.sendWithStatus(Status.BadRequest)('Summoner search is not in favorites'),
            ),
          ),
        ),
      ),

    setChampionsShardsCount,

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
        M.cookie(constants.accountCookieName, Token.codec.encode(token), {
          maxAge: accountCookieTtl,
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
    userId: UserId,
    favoriteSearches: List<PlatformWithPuuid>,
  ): Future<List<SummonerShort>> {
    return pipe(
      favoriteSearches,
      List.traverse(Future.ApplicativePar)(({ platform, puuid }) =>
        pipe(
          apply.sequenceT(futureMaybe.ApplyPar)(
            summonerService.findByPuuid(platform, puuid),
            riotAccountService.findByPuuid(puuid),
          ),
          Future.map(
            Maybe.foldW(
              () => Either.left<PlatformWithPuuid, never>({ platform, puuid }),
              ([summoner, { riotId }]) =>
                Either.right<never, SummonerShort>({ ...summoner, riotId }),
            ),
          ),
        ),
      ),
      Future.chain(eithers => {
        const { left, right } = List.separate(eithers)
        return pipe(
          apply.sequenceT(Future.ApplyPar)(
            userService.removeAllFavoriteSearches(userId, left),
            summonerService.deleteByPuuid(left),
          ),
          Future.map(() => right),
        )
      }),
    )
  }

  function setChampionsShardsCount(
    platform: Platform,
    puuid: Puuid,
  ): (user: TokenContent) => EndedMiddleware {
    return user =>
      EndedMiddleware.withBody(ChampionShardsPayload.codec)(championShards =>
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
              summonerService.findByPuuid(platform, puuid),
              Future.map(Either.fromOption(() => Tuple.of(Status.NotFound, 'Summoner not found'))),
            ),
          ),
          futureEither.bind('championShardsLevel', ({ validatedChampionShards, summoner }) =>
            pipe(
              getChampionShardsLevel(platform, summoner.puuid, validatedChampionShards),
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
    championShards: NonEmptyArray<ChampionShard>,
  ): Future<ValidatedNea<ChampionKey, NonEmptyArray<ChampionShard>>> {
    return pipe(
      ddragonService.latestChampions('en_GB' /* whatever, because unused */),
      Future.map(({ value: dataChampions }) => {
        const validChampionKeys = pipe(
          dataChampions.data,
          DictUtils.entries,
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
    puuid: Puuid,
    validatedChampionShards: NonEmptyArray<ChampionShard>,
  ): Future<Maybe<NonEmptyArray<ChampionShardsLevel>>> {
    return pipe(
      masteriesService.findBySummoner(platform, puuid),
      futureMaybe.map(({ champions }) =>
        pipe(
          validatedChampionShards,
          NonEmptyArray.map(({ championId, shardsCount }) => ({
            championId,
            shardsCount,
            championLevel: pipe(
              pipe(
                champions,
                ListUtils.findFirstBy(ChampionKey.Eq)(m => m.championId),
              )(championId),
              Maybe.map(m => m.championLevel),
              Maybe.getOrElse<ChampionLevel>(() => 0),
            ),
          })),
        ),
      ),
    )
  }
}

export { UserController }
