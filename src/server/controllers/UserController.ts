import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { PlatformWithName } from '../../shared/models/api/summoner/PlatformWithName'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { LoginPayload } from '../../shared/models/api/user/LoginPayload'
import { Token } from '../../shared/models/api/user/Token'
import { UserView } from '../../shared/models/api/user/UserView'
import { Future, List, Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { TokenContent } from '../models/user/TokenContent'
import type { RiotApiService } from '../services/RiotApiService'
import type { UserService } from '../services/UserService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type UserController = ReturnType<typeof UserController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserController(riotApiService: RiotApiService, userService: UserService) {
  const login: EndedMiddleware = pipe(
    M.decodeBody([LoginPayload.codec, 'LoginPayload']),
    M.matchE(
      () => M.of(Maybe.none),
      ({ userName, password }) => M.fromTaskEither(userService.login(userName, password)),
    ),
    M.ichain(
      Maybe.fold(
        () => M.sendWithStatus(Status.BadRequest)(''),
        token =>
          pipe(
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
          ),
      ),
    ),
  )

  const logout: EndedMiddleware = pipe(
    pipe(
      M.status(Status.NoContent),
      M.ichain(() => M.clearCookie(constants.account.cookie.name, {})),
      M.ichain(() => M.closeHeaders()),
      M.ichain(() => M.send('')),
    ),
  )

  return {
    getSelf: (user: TokenContent): EndedMiddleware =>
      pipe(
        userService.getUser(user.id),
        futureMaybe.chainTaskEitherK(({ userName, favoriteSearches }) =>
          apply.sequenceS(Future.ApplyPar)({
            userName: Future.right(userName),
            favoriteSearches: pipe(
              favoriteSearches,
              List.traverse(Future.ApplicativePar)(({ platform, puuid }) =>
                pipe(
                  riotApiService.lol.summoner.byPuuid(platform, puuid),
                  // TODO: when not found, remove from favorites and from summoners db
                  Future.map((summoner): SummonerShort => ({ ...summoner, platform })),
                ),
              ),
            ),
          }),
        ),
        M.fromTaskEither,
        M.ichain(Maybe.fold(() => M.sendWithStatus(Status.NotFound)(''), M.json(UserView.codec))),
      ),

    addFavoriteSelf: (user: TokenContent): EndedMiddleware =>
      pipe(
        M.decodeBody([PlatformWithName.codec, 'PlatformWithName']),
        M.ichainTaskEitherK(({ platform, name }) =>
          pipe(
            riotApiService.lol.summoner.byName(platform, name),
            Future.chain(({ puuid }) =>
              userService.addFavoriteSearch(user.id, { platform, puuid }),
            ),
          ),
        ),
        M.ichain(
          Maybe.fold(
            () => M.sendWithStatus(Status.NotFound)('User not found'),
            added =>
              added
                ? M.noContent()
                : M.sendWithStatus(Status.BadRequest)('Summoner search is already in favorites'),
          ),
        ),
      ),

    login,
    logout,
  }
}

export { UserController }
