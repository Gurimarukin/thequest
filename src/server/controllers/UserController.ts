import { apply } from 'fp-ts'
import type { Lazy } from 'fp-ts/function'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { PlatformWithName } from '../../shared/models/api/summoner/PlatformWithName'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { DiscordCodePayload } from '../../shared/models/api/user/DiscordCodePayload'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import { Token } from '../../shared/models/api/user/Token'
import { UserView } from '../../shared/models/api/user/UserView'
import { Either, Future, List, Maybe } from '../../shared/utils/fp'
import { futureEither } from '../../shared/utils/futureEither'
import { validatePassword } from '../../shared/validations/validatePassword'

import { constants } from '../config/constants'
import type { PlatformWithPuuid } from '../models/PlatformWithPuuid'
import type { Summoner } from '../models/summoner/Summoner'
import type { TokenContent } from '../models/user/TokenContent'
import type { UserId } from '../models/user/UserId'
import type { DiscordService } from '../services/DiscordService'
import type { SummonerService } from '../services/SummonerService'
import type { UserService } from '../services/UserService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'

type UserController = ReturnType<typeof UserController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserController(
  discordService: DiscordService,
  summonerService: SummonerService,
  userService: UserService,
) {
  const loginDiscord: EndedMiddleware = EndedMiddleware.withBody(DiscordCodePayload.codec)(
    ({ code }) =>
      pipe(
        discordService.oauth2.token.post(code),
        Future.chain(r => discordService.users.me.get(r.access_token)),
        M.fromTaskEither,
        M.ichain(res => {
          console.log('res =', res)
          return M.sendWithStatus(Status.InternalServerError)('TODO')
        }),
      ),
  )

  const loginPassword: EndedMiddleware = EndedMiddleware.withBody(LoginPasswordPayload.codec)(
    ({ userName, password }) =>
      pipe(
        userService.login(userName, password),
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

  const registerPassword: EndedMiddleware = EndedMiddleware.withBody(LoginPasswordPayload.codec)(
    flow(
      Either.right,
      Either.bind('validatedPassword', ({ password }) => validatePassword(password)),
      Future.right,
      futureEither.chain(({ userName, validatedPassword }) =>
        pipe(
          userService.createUser(userName, validatedPassword),
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
        futureEither.chainTaskEitherK(({ userName, favoriteSearches }) =>
          apply.sequenceS(Future.ApplyPar)({
            userName: Future.right(userName),
            favoriteSearches: pipe(
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

    loginDiscord,
    loginPassword,
    logout,
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
}

export { UserController }
