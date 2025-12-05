import { adminOrHigher, adminOrHigherOrSelf, moderatorOrHigherOrSelf, publicAccess } from '@/access'
import { Role } from '@/access/hierarchy'
import { APIError, type CollectionConfig } from 'payload'
import type { PayloadRequest } from 'payload'

/**
 * User roles and their permissions:
 *
 * @role admin - Full system access. Can manage all users, content, and settings.
 * @role moderator - Can review and manage content, handle reports, and suspend users.
 * @role service-provider - Can create, edit, and manage their own services and availability.
 * @role client - Can browse services, make bookings, and manage their own profile.
 *
 * You can manage hierarchy inside /src/access/hierarchy.ts
 */
const userRoles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Service Provider', value: 'service-provider' },
  { label: 'Client', value: 'client' },
] as const satisfies ReadonlyArray<{ label: string; value: Role }>

// Roles that only admins can assign
const protectedRoles: Role[] = ['admin', 'moderator']

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: moderatorOrHigherOrSelf,
    update: adminOrHigher,
    delete: adminOrHigherOrSelf, // only admin or user can delete its account
    create: publicAccess, // everyone can create new account
  },
  hooks: {
    beforeValidate: [
      ({ req, data }) => {
        const user = req.user

        // Block protected roles for non-admins (API-level protection)
        if (!user || user.role !== 'admin') {
          if (data?.role && protectedRoles.includes(data.role)) {
            throw new APIError(
              'You do not have permission to assign this role.',
              400,
              undefined,
              true,
            )
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [...userRoles],
      defaultValue: 'client',
      required: true,
      filterOptions: ({ req, options }) => {
        // Admins can see all roles
        if (req.user?.role === 'admin') {
          return options
        }
        // Non-admins only see non-protected roles
        return options.filter((option) => {
          const roleValue = typeof option === 'string' ? option : option.value
          return !protectedRoles.includes(roleValue as Role)
        })
      },
      validate: (value: string | null | undefined, { req }: { req: PayloadRequest }) => {
        const user = req.user
        // Additional validation to ensure non-admins can't select protected roles
        if (user?.role !== 'admin' && value && protectedRoles.includes(value as Role)) {
          return 'You do not have permission to assign this role.'
        }
        return true
      },
    },
  ],
}
