import {
  adminOrHigher,
  adminOrHigherOrSelf,
  moderatorOrHigher,
  moderatorOrHigherOrSelf,
  publicAccess,
} from '@/access'
import { fieldRoleOrHigher, isClientRoleEqual, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { APIError, type CollectionConfig } from 'payload'

const MAX_PROFILE_PICTURE_BYTES = 1 * 1024 * 1024 // 1MB (adjust as needed)

export const ProfilePictures: CollectionConfig = {
  slug: 'profile-pictures',
  labels: {
    singular: {
      en: 'Profile Picture',
      pl: 'Zdjęcie Profilowe',
    },
    plural: {
      en: 'Profile Pictures',
      pl: 'Zdjęcia Profilowe',
    },
  },
  admin: {
    hidden: ({ user }) => !isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'Upload and manage user profile pictures.',
      pl: 'Przesyłaj i zarządzaj zdjęciami profilowymi.',
    },
    group: adminGroups.uploads,
  },
  access: {
    read: publicAccess,
    update: adminOrHigherOrSelf('user'),
    delete: adminOrHigherOrSelf('user'),
    create: publicAccess,
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
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'avatar',
        width: 512,
        height: 512,
        crop: 'center',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
    ],
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
  },
}
