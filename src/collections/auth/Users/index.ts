import {
  adminOrHigherOrSelf,
  fieldAdminOrHigher,
  moderatorOrHigherOrSelf,
  publicAccessField,
} from '@/access'
import { userRoles } from '@/access/hierarchy'
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { auth } from '@/auth/auth'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'

import { deleteRelatedUserData, syncProfilePicture } from './hooks'

// TODO:
// [] Add field to chosen category
// [] Add preview feature for offers in the admin panel

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: {
      en: 'User',
      pl: 'Użytkownik',
    },
    plural: {
      en: 'Users',
      pl: 'Użytkownicy',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'profilePicture', 'role', 'subscriptionDetails'],
    group: adminGroups.auth,
    hidden: ({ user }) => !isClientRoleEqualOrHigher('moderator', user),
  },
  auth: {
    disableLocalStrategy: true, // We should disable this since we use Better Auth now
    strategies: [
      {
        name: 'better-auth',
        authenticate: async ({ headers, payload }) => {
          try {
            // 1. Get user session from Better Auth using request headers
            const userSession = await auth.api.getSession({ headers })

            // 2. If no session exists, return null (not authenticated)
            if (!userSession || !userSession.user) return { user: null }

            // 3. Fetch full user data from Payload database
            const userData = await payload.findByID({
              collection: 'users',
              id: userSession?.user?.id,
            })

            // 4. Return user data in the expected format
            return {
              user: {
                ...userData,
                collection: 'users',
              },
            }
          } catch (err) {
            payload.logger.error(err)
            return { user: null }
          }
        },
      },
    ],
  },
  endpoints: [
    {
      path: '/logout',
      method: 'post',
      handler: async (req) => {
        // 1. Call Better Auth signOut to invalidate the session
        await auth.api.signOut({
          headers: req.headers,
        })

        // 2. Return success response
        return Response.json(
          {
            message: 'Token revoked successfully',
          },
          {
            status: 200,
            headers: req.headers,
          },
        )
      },
    },
  ],
  access: {
    read: moderatorOrHigherOrSelf(),
    update: adminOrHigherOrSelf(),
    delete: adminOrHigherOrSelf(),
    create: () => false, // no one can create users directly (happens via Better Auth)
  },
  hooks: {
    beforeDelete: [deleteRelatedUserData],
    beforeChange: [syncProfilePicture],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'profilePicture',
              type: 'upload',
              relationTo: 'profile-pictures',
              label: {
                en: 'Profile Picture',
                pl: 'Zdjęcie Profilowe',
              },
            },
            {
              name: 'role',
              type: 'select',
              options: [...userRoles],
              defaultValue: 'client',
              required: true,
              label: {
                en: 'Role',
                pl: 'Rola',
              },
              access: {
                read: publicAccessField,
                update: fieldAdminOrHigher,
              },
              admin: {
                position: 'sidebar',
                condition: (data, siblingData, { user }) => {
                  return isClientRoleEqualOrHigher('moderator', user)
                },
                components: {
                  Field: '/components/payload/fields/roleSelect',
                },
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'serviceCategory',
                  type: 'text',
                  label: {
                    en: 'Service Category',
                    pl: 'Kategoria Usług',
                  },
                  admin: {
                    position: 'sidebar',
                    readOnly: true,
                    description: {
                      en: 'The category of services offered by the service provider.',
                      pl: 'Kategoria usług oferowanych przez dostawcę usług.',
                    },
                    condition: (data) => {
                      return data?.role === 'service-provider' || !!data?.ServiceCategory
                    },
                  },
                  access: {
                    read: publicAccessField,
                    update: fieldAdminOrHigher,
                  },
                },
                {
                  name: 'changeCategory',
                  type: 'ui',
                  admin: {
                    condition: (data, siblingData, { user }) => {
                      // Show only for service providers viewing their own profile
                      return (
                        data?.role === 'service-provider' &&
                        isClientRoleEqualOrHigher('service-provider', user)
                      )
                    },
                    components: {
                      Field: '/components/payload/fields/upgradeSubscription',
                    },
                  },
                },
              ],
            },

            {
              name: 'serviceCategorySlug',
              type: 'text',
              label: {
                en: 'Service Category Slug',
                pl: 'Slug Kategorii Usług',
              },
              admin: {
                position: 'sidebar',
                readOnly: true,
                description: {
                  en: "Machine-readable slug for the service category (e.g., 'music/dj/wedding-dj').",
                  pl: "Maszynowo czytelny slug dla kategorii usług (np. 'muzyka/dj/dj-na-wesele').",
                },
                condition: (data, siblingData, { user }) => {
                  return isClientRoleEqualOrHigher('moderator', user)
                },
              },
              access: {
                read: publicAccessField,
                update: fieldAdminOrHigher,
              },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              index: true,
              label: {
                en: 'Name',
                pl: 'Imię',
              },
            },
            {
              name: 'email',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: 'Email',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'emailVerified',
              type: 'checkbox',
              required: true,
              label: {
                en: 'Email Verified',
                pl: 'Email Zweryfikowany',
              },
              access: {
                read: publicAccessField,
                update: fieldAdminOrHigher,
              },
            },
            {
              name: 'image',
              type: 'text',
              label: {
                en: 'Image',
                pl: 'Obraz',
              },
              admin: {
                // Actually we will probably not use this one, it's for better auth
                hidden: true,
                readOnly: true,
                position: 'sidebar',
                description: {
                  en: 'public URL to the user profile picture',
                  pl: 'publiczny URL do zdjęcia profilowego użytkownika',
                },
                condition: (data, siblingsData, { user }) => {
                  return isClientRoleEqualOrHigher('moderator', user)
                },
              },
              access: {
                read: publicAccessField,
              },
            },
            {
              name: 'becomeServiceProvider',
              type: 'ui',
              label: {
                en: 'Become a Service Provider',
                pl: 'Zostań usługodawcą',
              },
              admin: {
                condition: (data) => data?.role === 'client',
                components: {
                  Field: '/components/payload/fields/becomeServiceProvider',
                },
              },
            },
          ],
          label: {
            en: 'General',
            pl: 'Ogólne',
          },
        },
        {
          label: {
            en: 'Subscription Management',
            pl: 'Zarządzanie Subskrypcją',
          },
          fields: [
            {
              name: 'subscriptionDetails',
              type: 'ui',
              label: {
                en: 'Subscription Details',
                pl: 'Szczegóły Subskrypcji',
              },
              admin: {
                components: {
                  Field: '/components/payload/fields/subscriptionDetails',
                  Cell: '/components/payload/cells/subscriptionDetails',
                },
              },
            },
          ],
        },
        // {
        //   fields: [
        //     {
        //       name: 'offers',
        //       type: 'join',
        //       collection: 'offers',
        //       on: 'user',
        //       hasMany: true,
        //       label: false,
        //       admin: {
        //         description: {
        //           en: 'Here you can see all offers you have created.',
        //           pl: 'Tutaj możesz zobaczyć wszystkie oferty, które utworzyłeś.',
        //         },
        //         allowCreate: true,
        //         condition: (data, siblingsData, { user }) => {
        //           return isClientRoleEqualOrHigher('service-provider', user)
        //         },
        //         // Disable default columns to prevent version.user query issue
        //         defaultColumns: ['title', 'updatedAt', '_status'],
        //       },
        //     },
        //   ],
        //   label: {
        //     en: 'My Portfolio',
        //     pl: 'Moje Portfolio',
        //   },
        //   admin: {
        //     // display only for service providers and higher
        //     condition: (data, siblingsData, { user }) => {
        //       return isClientRoleEqualOrHigher('service-provider', user)
        //     },
        //   },
        // },
      ],
    },
  ],
}
