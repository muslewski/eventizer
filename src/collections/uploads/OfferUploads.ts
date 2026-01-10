import { moderatorOrHigherOrSelf, publicAccess } from '@/access'
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
    // hidden: ({ user }: { user: ClientUser }) => !isClientRoleEqualOrHigher('moderator', user),
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
    create: publicAccess,
    update: moderatorOrHigherOrSelf('user'),
    delete: moderatorOrHigherOrSelf('user'),
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
      required: true,
      label: {
        en: 'Title',
        pl: 'Tytuł',
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
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
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
