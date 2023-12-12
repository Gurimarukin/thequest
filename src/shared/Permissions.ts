import type { UserRole } from './models/api/user/UserRole'

function canViewAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export const Permissions = { canViewAdmin }
