import { pipe } from 'fp-ts/function'

import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import { Future } from '../../shared/utils/fp'

import { HashedPassword } from '../models/user/HashedPassword'

/* eslint-disable @typescript-eslint/no-var-requires */
const argon2 = require('@phc/argon2')
const upash = require('upash')
/* eslint-enable @typescript-eslint/no-var-requires */

// eslint-disable-next-line functional/no-expression-statements
upash.install('argon2', argon2)

const hash = (clearPassword: ClearPassword): Future<HashedPassword> =>
  pipe(
    Future.tryCatch(() => upash.hash(clearPassword) as Promise<string>),
    Future.map(HashedPassword),
  )

const check = (hashedPassword: HashedPassword, clearPassword: ClearPassword): Future<boolean> =>
  Future.tryCatch(() =>
    upash.verify(HashedPassword.unwrap(hashedPassword), ClearPassword.unwrap(clearPassword)),
  )

export const PasswordUtils = { hash, check }
