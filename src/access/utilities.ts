import type { User } from '@/payload-types'

export const checkRole = (allRoles: User['role'][], user?: User | null): boolean => {
  if (user && user.role) {
    return allRoles.includes(user.role)
  }

  return false
}
