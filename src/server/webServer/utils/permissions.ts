import type { Predicate } from 'fp-ts/Predicate'
import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'

import { Permissions } from '../../../shared/Permissions'
import type { ValidatedSoft } from '../../../shared/models/ValidatedSoft'
import type { UserRole } from '../../../shared/models/api/user/UserRole'
import type { List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import type { TokenContent } from '../../models/user/TokenContent'
import type { EndedMiddleware } from '../models/MyMiddleware'
import { MyMiddleware } from '../models/MyMiddleware'

const allow =
  (permissions: Predicate<UserRole>) =>
  (role: UserRole) =>
  (m: EndedMiddleware): EndedMiddleware =>
    permissions(role) ? m : MyMiddleware.sendWithStatus(Status.Forbidden)('')

export const WithPermissions = {
  admin: {
    hallOfFame: {
      list: allow(Permissions.canViewAdmin),
      update: allow(Permissions.canUpdateAdmin),
    },
  },
}

/** Empties errors if user is not allowed */
export function validateSoftEncoder<O, A>(
  maybeUser: Maybe<TokenContent>,
  valueEncoder: Encoder<O, A>,
): Encoder<ValidatedSoft<O, string>, ValidatedSoft<A, string>> {
  return E.struct({
    value: valueEncoder,
    errors: pipe(
      E.readonly(E.array(E.id<string>())),
      E.contramap((errors: List<string>) =>
        pipe(
          maybeUser,
          Maybe.exists(user => user.role === 'admin'),
        )
          ? errors
          : [],
      ),
    ),
  })
}
