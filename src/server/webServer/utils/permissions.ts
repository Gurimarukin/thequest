import type { Predicate } from 'fp-ts/Predicate'
import { Status } from 'hyper-ts'

import { Permissions } from '../../../shared/Permissions'
import type { UserRole } from '../../../shared/models/api/user/UserRole'

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

export const ServerPermissions = {
  staticDataViewErrors: (role: UserRole): boolean => role === 'admin',
}
