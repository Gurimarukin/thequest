import { pipe } from 'fp-ts/function'

import type { ClearPassword } from '../../shared/models/webUser/ClearPassword'
import type { Token } from '../../shared/models/webUser/Token'
import type { UserName } from '../../shared/models/webUser/UserName'
import type { Future, Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { JwtHelper } from '../helpers/JwtHelper'
import { TokenContent } from '../models/webUser/TokenContent'
import type { UserPersistence } from '../persistence/UserPersistence'
import { PasswordUtils } from '../utils/PasswordUtils'

type UserService = ReturnType<typeof UserService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserService(userPersistence: UserPersistence, jwtHelper: JwtHelper) {
  const signToken = (content: TokenContent): Future<Token> =>
    jwtHelper.sign(TokenContent.codec)(content, { expiresIn: constants.account.tokenTtl })

  const verifyToken = (token: string): Future<TokenContent> =>
    jwtHelper.verify([TokenContent.codec, 'TokenContent'])(token)

  return {
    verifyToken,

    login: (userName: UserName, clearPassword: ClearPassword): Future<Maybe<Token>> =>
      pipe(
        futureMaybe.Do,
        futureMaybe.apS('user', userPersistence.findByUserName(userName)),
        futureMaybe.bind('validPassword', ({ user }) =>
          futureMaybe.fromTaskEither(PasswordUtils.check(user.password, clearPassword)),
        ),
        futureMaybe.filter(({ validPassword }) => validPassword),
        futureMaybe.chainTaskEitherK(({ user }) => signToken({ id: user.id })),
      ),
  }
}

export { UserService }
