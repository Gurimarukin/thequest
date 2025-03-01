// @ts-expect-error types don't exist
import argon2 from '@phc/argon2'
import { pipe } from 'fp-ts/function'
// @ts-expect-error types don't exist
import upash from 'upash'

import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import { Future } from '../../shared/utils/fp'

import { HashedPassword } from '../models/user/HashedPassword'

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
