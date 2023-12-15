import type { UserRole } from './models/api/user/UserRole'

const isAdmin = (role: UserRole): boolean => role === 'admin'

export const Permissions = {
  canViewAdmin: isAdmin,
  canUpdateAdmin: isAdmin,
}
