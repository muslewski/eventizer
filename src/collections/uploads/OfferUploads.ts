import {
  moderatorOrHigher,
  moderatorOrHigherOrSelf,
  providerOrHigher,
  publicAccess,
} from '@/access'
import { isClientRoleEqual, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { meta } from 'better-auth'
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
  admin: {
    hidden: ({ user }: { user: ClientUser }) => !isClientRoleEqualOrHigher('moderator', user),
    description: {
      en: 'Upload and manage files related to offers.',
      pl: 'Przesyłaj i zarządzaj plikami związanymi z ofertami.',
    },
    group: adminGroups.uploads,
  },
  access: {
    read: publicAccess,
    create: moderatorOrHigherOrSelf('user'),
    update: moderatorOrHigherOrSelf('user'),
    delete: moderatorOrHigherOrSelf('user'),
  },
  fields: [
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
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
      required: true,
      label: {
        en: 'Offer',
        pl: 'Oferta',
      },
    },
  ],
  upload: true,
}
