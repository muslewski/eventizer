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
    defaultColumns: ['filename', 'usedBy', 'updatedAt', 'createdAt'],
  },
  access: {
    read: publicAccess,
    update: adminOrHigherOrSelf('user'),
    delete: adminOrHigherOrSelf('user'),
    create: publicAccess,
  },
  fields: [
    {
      name: 'usedBy',
      type: 'join',
      collection: 'users',
      on: 'profilePicture',
      label: {
        en: 'Used By',
        pl: 'Używane przez',
      },
      hasMany: false,
      defaultLimit: 1,
      admin: {
        allowCreate: false,
        // disableListFilter: true,
        // position: 'sidebar',
        condition: (data, siblingsData, { user }) => {
          // Only show image field to moderators and higher
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
