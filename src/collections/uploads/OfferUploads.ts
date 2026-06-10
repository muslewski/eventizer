import { adminOrHigherOrSelfByEmail } from '@/access'
import { authenticated } from '@/access/authenticated'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { ClientUser } from 'node_modules/payload/dist/auth/types'
import { CollectionConfig } from 'payload'

export const OfferUploads: CollectionConfig = {
  slug: 'offer-uploads',
  labels: {
    singular: {
      en: 'Offer Upload',
      pl: 'Plik Oferty',
    },
    plural: {
      en: 'Offer Uploads',
      pl: 'Pliki Ofert',
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
    ],
  },
  admin: {
    hidden: ({ user }) => !isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'Upload and manage files related to offers.',
      pl: 'Przesyłaj i zarządzaj plikami związanymi z ofertami.',
    },
    group: adminGroups.uploads,
    defaultColumns: ['filename', 'user', 'updatedAt', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      // If no user, allow public read (for viewing images)
      if (!user) return true

      // Moderators and above can see all
      if (isClientRoleEqualOrHigher('moderator', user)) return true

      // Regular users only see their own uploads in lists
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: authenticated,
    // update: moderatorOrHigherOrSelf('user'),
    // delete: moderatorOrHigherOrSelf('user'),
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
          en: 'User who uploaded this file.',
          pl: 'Użytkownik, który przesłał ten plik.',
        },
        readOnly: true,
        condition: (data, siblingData, { user }) => isClientRoleEqualOrHigher('moderator', user),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: false,
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
      admin: {
        condition: (data, siblingData, { user }) => isClientRoleEqualOrHigher('moderator', user),
      }
    },
    {
      name: 'zoom',
      type: 'number',
      defaultValue: 1,
      min: 1,
      max: 3,
      label: {
        en: 'Zoom',
        pl: 'Przybliżenie',
      },
      admin: {
        description: {
          en: 'Scale multiplier for the stored focal point (1–3).',
          pl: 'Mnożnik skali dla punktu głównego (1–3).',
        },
        step: 0.1,
      },
    },
    // {
    //   name: 'description',
    //   type: 'textarea',
    //   required: true,
    //   label: {
    //     en: 'Description',
    //     pl: 'Opis',
    //   },
    // },
    // {
    //   name: 'offer',
    //   type: 'relationship',
    //   relationTo: 'offers',
    //   required: true,
    //   label: {
    //     en: 'Offer',
    //     pl: 'Oferta',
    //   },
    // },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    resizeOptions: {
      width: 1920,
      height: 1080,
      fit: 'inside', // Maintains aspect ratio, fits within bounds
      withoutEnlargement: true, // Don't upscale small images
    },
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
  },
}
