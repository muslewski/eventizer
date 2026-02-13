import { adminOrHigherOrSelfByEmail, publicAccess } from '@/access'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'
import { compressVideoHook } from './hooks/compressVideo'

/** Maximum video file size: 50 MB */
export const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024

export const OfferVideoUploads: CollectionConfig = {
  slug: 'offer-video-uploads',
  labels: {
    singular: {
      en: 'Offer Video',
      pl: 'Wideo Oferty',
    },
    plural: {
      en: 'Offer Videos',
      pl: 'Wideo Ofert',
    },
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        // Automatically set user to the current user on create
        if (operation === 'create' && req.user) {
          data.user = req.user.id
        }
        return data
      },
      compressVideoHook,
    ],
  },
  admin: {
    hidden: ({ user }) => !isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'Upload and manage videos related to offers. (max 50 MB, mp4/webm)',
      pl: 'Przesyłaj i zarządzaj filmami związanymi z ofertami. (maks. 50 MB, mp4/webm)',
    },
    group: adminGroups.uploads,
    defaultColumns: ['filename', 'user', 'updatedAt', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      // If no user, allow public read (for viewing videos)
      if (!user) return true

      // Moderators and above can see all
      if (isClientRoleEqualOrHigher('moderator', user)) return true

      // Regular users only see their own uploads
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: publicAccess,
    update: adminOrHigherOrSelfByEmail('uploadedBy'),
    delete: adminOrHigherOrSelfByEmail('uploadedBy'),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: {
        en: 'Uploaded By',
        pl: 'Przesłane przez',
      },
      access: {
        read: fieldRoleOrHigher('moderator'),
        update: fieldRoleOrHigher('admin'),
      },
      admin: {
        description: {
          en: 'User who uploaded this video.',
          pl: 'Użytkownik, który przesłał ten film.',
        },
        readOnly: true,
        condition: (data, siblingData, { user }) => isClientRoleEqualOrHigher('moderator', user),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
    },
  ],
  upload: {
    mimeTypes: ['video/mp4', 'video/webm'],
    // No sharp processing for videos — skip resizeOptions/formatOptions
    // File size is enforced by the global upload limit + collection validation
  },
}
