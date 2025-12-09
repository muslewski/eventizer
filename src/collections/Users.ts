import { adminOrHigher, adminOrHigherOrSelf, moderatorOrHigherOrSelf, publicAccess } from '@/access'
import { getRoleConfig, Role, userRoles } from '@/access/hierarchy'
import { APIError, type CollectionConfig } from 'payload'

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
          if (data?.role && getRoleConfig(data.role).isProtected) {
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
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'role',
      type: 'select',
      options: [...userRoles],
      defaultValue: 'client',
      required: true,
      admin: {
        components: {
          Field: '/components/payload/fields/roleSelect',
        },
      },
      // filterOptions: ({ req, options }) => {
      //   // Admins can see all roles
      //   if (req.user?.role === 'admin') {
      //     return options
      //   }
      //   // Non-admins only see non-protected roles
      //   return options.filter((option) => {
      //     const roleValue = typeof option === 'string' ? option : option.value
      //     return !getRoleConfig(roleValue as Role).isProtected
      //   })
      // },
    },
  ],
}
