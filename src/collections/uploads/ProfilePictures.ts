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

  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes

        if (data?.file?.size && data.file.size > maxSize) {
          throw new APIError(
            req.i18n.language === 'pl'
              ? `Rozmiar pliku nie może przekraczać 5MB. Obecny rozmiar: ${(data.file.size / 1024 / 1024).toFixed(2)}MB`
              : `File size cannot exceed 5MB. Current size: ${(data.file.size / 1024 / 1024).toFixed(2)}MB`,
            400,
          )
        }

        return data
      },
    ],
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
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    // resize images to 1000px to 1000px
    resizeOptions: {
      width: 1000,
      height: 1000,
      fit: 'cover',
      position: 'center',
    },
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
  },
}
