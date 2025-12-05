import { User } from '@/payload-types'

export type Role = User['role']

/**
 * Role hierarchy tree:
 *        admin
 *          │
 *      moderator
 *        /   \
 *   provider  client
 */
export const roleParents: Record<Role, Role | null> = {
  admin: null,
  moderator: 'admin',
  'service-provider': 'moderator',
  client: 'moderator',
}
