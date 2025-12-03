import type { CollectionConfig } from 'payload'

/**
 * User roles and their permissions:
 *
 * @role admin - Full system access. Can manage all users, content, and settings.
 * @role moderator - Can review and manage content, handle reports, and suspend users.
 * @role service-provider - Can create, edit, and manage their own services and availability.
 * @role client - Can browse services, make bookings, and manage their own profile.
 */
const userRoles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Service Provider', value: 'service-provider' },
  { label: 'Client', value: 'client' },
] as const

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [...userRoles],
      defaultValue: 'client',
      required: true,
    },
  ],
}
