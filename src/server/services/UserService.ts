import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import readline from 'readline'

import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import type { Token } from '../../shared/models/api/user/Token'
import { UserName } from '../../shared/models/api/user/UserName'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { JwtHelper } from '../helpers/JwtHelper'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { TokenContent } from '../models/user/TokenContent'
import { User } from '../models/user/User'
import { UserId } from '../models/user/UserId'
import type { UserPersistence } from '../persistence/UserPersistence'
import { PasswordUtils } from '../utils/PasswordUtils'

type UserService = ReturnType<typeof UserService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserService(Logger: LoggerGetter, userPersistence: UserPersistence, jwtHelper: JwtHelper) {
  const logger = Logger('UserService')

  const createUser: Future<NotUsed> = pipe(
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
            apply.sequenceS(Future.ApplyPar)({
              id: Future.fromIOEither(UserId.generate),
              hashed: PasswordUtils.hash(ClearPassword.wrap(password)),
            }),
            Future.chain(({ id, hashed }) =>
              userPersistence.create(User.of(id, UserName.wrap(userName), hashed)),
            ),
            Future.filterOrElse(
              success => success,
              () => Error('Failed to create user'),
            ),
            Future.map(toNotUsed),
          ),
    ),
  )

  return {
    createUser,

    verifyToken: (token: string): Future<TokenContent> =>
      jwtHelper.verify([TokenContent.codec, 'TokenContent'])(token),

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

    getUser: userPersistence.findById,
  }

  function signToken(content: TokenContent): Future<Token> {
    return jwtHelper.sign(TokenContent.codec)(content, { expiresIn: constants.account.tokenTtl })
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
          // eslint-disable-next-line functional/no-expression-statement
          rl.close()
          return res
        },
      )
    }),
  )
