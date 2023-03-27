import { parse as parseCookie } from 'cookie'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { Dict, Either, Future, Maybe, Try } from '../../../shared/utils/fp'
import { futureMaybe } from '../../../shared/utils/futureMaybe'

import { constants } from '../../config/constants'
import type { TokenContent } from '../../models/user/TokenContent'
import type { UserService } from '../../services/UserService'
import type { EndedMiddleware } from '../models/MyMiddleware'
import { MyMiddleware as M } from '../models/MyMiddleware'
import { SimpleHttpResponse } from '../models/SimpleHttpResponse'
import type { UpgradeHandler } from '../models/UpgradeHandler'

type WithAuth = Readonly<ReturnType<typeof WithAuth>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const WithAuth = (userService: UserService) => {
  return {
    middleware: (f: (user: TokenContent) => EndedMiddleware): EndedMiddleware =>
      middlewareMaybe(Maybe.fold(() => M.sendWithStatus(Status.Unauthorized)(''), f)),

    middlewareMaybe,

    upgrade:
      (f: (user: TokenContent) => UpgradeHandler): UpgradeHandler =>
      (request, socket, head) =>
        pipe(
          futureMaybe.fromNullable(request.headers.cookie),
          futureMaybe.chainEitherK(cookie => Try.tryCatch(() => parseCookie(cookie))),
          futureMaybe.chainOptionK(Dict.lookup(constants.account.cookie.name)),
          Future.chain(
            Maybe.fold(
              () => Future.right(Either.left(SimpleHttpResponse.of(Status.Unauthorized, ''))),
              flow(
                userService.verifyToken,
                Future.map(Either.right),
                Future.orElse(() =>
                  Future.right(
                    Either.left(
                      SimpleHttpResponse.of(Status.Unauthorized, 'Invalid token', {
                        'Set-Cookie': [
                          `${constants.account.cookie.name}=`,
                          'Path=/',
                          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                        ],
                      }),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Future.chain(
            Either.fold(flow(Either.left, Future.right), user => f(user)(request, socket, head)),
          ),
        ),
  }

  function middlewareMaybe(
    f: (maybeUser: Maybe<TokenContent>) => EndedMiddleware,
  ): EndedMiddleware {
    return pipe(
      M.getCookies(),
      M.map(Dict.lookup(constants.account.cookie.name)),
      M.ichain(
        Maybe.fold(
          () => f(Maybe.none),
          flow(
            userService.verifyToken,
            M.fromTaskEither,
            M.matchE(
              () =>
                pipe(
                  M.status(Status.Unauthorized),
                  M.ichain(() => M.clearCookie(constants.account.cookie.name, {})),
                  M.ichain(() => M.closeHeaders()),
                  M.ichain(() => M.send('Invalid token')),
                ),
              flow(Maybe.some, f),
            ),
          ),
        ),
      ),
    )
  }
}

export { WithAuth }
