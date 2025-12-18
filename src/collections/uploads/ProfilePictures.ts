import {
  adminOrHigher,
  adminOrHigherOrSelf,
  adminOrHigherOrSelfByEmail,
  moderatorOrHigher,
  moderatorOrHigherOrSelf,
  moderatorOrHigherOrSelfByEmail,
  publicAccess,
} from '@/access'
import { fieldRoleOrHigher, isClientRoleEqual, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'

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
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        // Automatically set uploadedBy to the current user on create
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.email
        }
        return data
      },
    ],
  },
  admin: {
    hidden: ({ user }) => !isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'Upload and manage user profile pictures.',
      pl: 'Przesyłaj i zarządzaj zdjęciami profilowymi.',
    },
    group: adminGroups.uploads,
    defaultColumns: ['filename', 'uploadedBy', 'updatedAt', 'createdAt'],
  },
  access: {
    // Public read access for viewing images, but query limits what appears in lists
    read: ({ req: { user } }) => {
      // If no user, allow public read (for viewing images)
      if (!user) return true

      // Moderators and above can see all
      if (isClientRoleEqualOrHigher('moderator', user)) return true

      // Regular users only see their own uploads in lists
      return {
        uploadedBy: {
          equals: user.email,
        },
      }
    },
    update: adminOrHigherOrSelfByEmail('uploadedBy'),
    delete: adminOrHigherOrSelfByEmail('uploadedBy'),
    create: publicAccess,
  },
  fields: [
    {
      name: 'uploadedBy',
      type: 'text',
      label: {
        en: 'Uploaded By',
        pl: 'Przesłane przez',
      },
      required: true,
      index: true,
      access: {
        read: fieldRoleOrHigher('moderator'),
      },
      admin: {
        description: {
          en: 'Email of the user who uploaded the profile picture.',
          pl: 'Email użytkownika, który przesłał zdjęcie profilowe.',
        },
        readOnly: true,
        condition: ({ user }) => isClientRoleEqualOrHigher('moderator', user),
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
