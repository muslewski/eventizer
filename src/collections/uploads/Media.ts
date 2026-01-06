import { adminOrHigher, moderatorOrHigher, moderatorOrHigherOrSelf, publicAccess } from '@/access'
import { fieldRoleOrHigher, isClientRoleEqual, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'
import { ad } from 'vitest/dist/chunks/reporters.d.DL9pg5DB.js'

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    hidden: ({ user }) => !isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'Upload and manage media files used throughout the application.',
      pl: 'Przesyłaj i zarządzaj plikami medialnymi używanymi w aplikacji.',
    },
    group: adminGroups.uploads,
  },
  access: {
    read: publicAccess,
    update: adminOrHigher,
    delete: adminOrHigher,
    create: adminOrHigher,
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: {
        en: 'User',
        pl: 'Użytkownik',
      },
      access: {
        read: fieldRoleOrHigher('moderator'),
        update: fieldRoleOrHigher('admin'),
      },
      defaultValue: ({ req }) => req.user?.id,
      admin: {
        condition: (data, siblingsData, { user }) => {
          return isClientRoleEqualOrHigher('moderator', user)
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: {
        en: 'Alt Text',
        pl: 'Tekst Alternatywny',
      },
    },
  ],
  upload: true,
}
