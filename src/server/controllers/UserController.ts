import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { LoginPayload } from '../../shared/models/api/user/LoginPayload'
import { Token } from '../../shared/models/api/user/Token'
import { UserView } from '../../shared/models/api/user/UserView'
import { List, Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { TokenContent } from '../models/user/TokenContent'
import type { UserService } from '../services/UserService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type UserController = ReturnType<typeof UserController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserController(userService: UserService) {
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
    getSelfUser: (user: TokenContent): EndedMiddleware =>
      pipe(
        userService.getUser(user.id),
        futureMaybe.map(
          ({ userName }): UserView => ({
            userName,
            favoriteSearches: List.empty, // TODO
          }),
        ),
        M.fromTaskEither,
        M.ichain(Maybe.fold(() => M.sendWithStatus(Status.NotFound)(''), M.json(UserView.codec))),
      ),

    login,
    logout,
  }
}

export { UserController }
