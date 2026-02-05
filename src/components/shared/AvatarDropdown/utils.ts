import type { User } from '@/payload-types'
import type { Role } from '@/access/hierarchy'

export function getInitials(user: User): string {
  if (user.name) {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.email?.slice(0, 2).toUpperCase() ?? 'U'
}

export function hasRole(user: User, role: string): boolean {
  if (Array.isArray(user.role)) {
    return user.role.includes(role as Role)
  }
  if (typeof user.role === 'string') {
    return user.role === role
  }
  return false
}
