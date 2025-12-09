import { User } from '@/payload-types'

export type Role = User['role']

/**
 * User roles and their permissions:
 *
 * @role admin - Full system access. Can manage all users, content, and settings.
 * @role moderator - Can review and manage content, handle reports, and suspend users.
 * @role service-provider - Can create, edit, and manage their own services and availability.
 * @role client - Can browse services, make bookings, and manage their own profile.
 *
 * Role hierarchy tree:
 *        admin
 *          │
 *      moderator
 *        /   \
 *   provider  client
 */
export const userRoles = [
  {
    label: 'Admin',
    value: 'admin',
    icon: 'SwordIcon',
    color: {
      text: 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300',
      bg: 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500',
      border: 'border-red-500 dark:border-red-400 hover:border-red-600 dark:hover:border-red-300',
    },
    isProtected: true,
    parent: null,
  },
  {
    label: 'Moderator',
    value: 'moderator',
    icon: 'ShieldAlertIcon',
    color: {
      text: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300',
      bg: 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500',
      border:
        'border-blue-500 dark:border-blue-400 hover:border-blue-600 dark:hover:border-blue-300',
    },
    isProtected: true,
    parent: 'admin',
  },
  {
    label: 'Service Provider',
    value: 'service-provider',
    icon: 'UserStarIcon',
    color: {
      text: 'text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300',
      bg: 'bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-500',
      border:
        'border-purple-500 dark:border-purple-400 hover:border-purple-600 dark:hover:border-purple-300',
    },
    isProtected: false,
    parent: 'moderator',
  },
  {
    label: 'Client',
    value: 'client',
    icon: 'UserRoundCheckIcon',
    color: {
      text: 'text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300',
      bg: 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500',
      border:
        'border-green-500 dark:border-green-400 hover:border-green-600 dark:hover:border-green-300',
    },
    isProtected: false,
    parent: 'moderator',
  },
] as const satisfies ReadonlyArray<{
  label: string
  value: Role
  icon: string
  color: {
    text: string
    bg: string
    border: string
  }
  isProtected: boolean
  parent: Role | null
}>

/** Get role config by value */
export const getRoleConfig = (role: Role) => userRoles.find((r) => r.value === role)!
