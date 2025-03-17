import type { UserRole } from './models/api/user/UserRole'

const isAdmin = (role: UserRole): boolean => role === 'admin'

export const Permissions = {
  canViewDocErrors: isAdmin,
  canViewAdmin: isAdmin,
  canUpdateAdmin: isAdmin,
}
