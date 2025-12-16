import {
  adminOrHigherOrSelf,
  moderatorOrHigher,
  moderatorOrHigherOrSelf,
  providerOrHigher,
} from '@/access'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: {
    singular: {
      en: 'Offer',
      pl: 'Oferta',
    },
    plural: {
      en: 'Offers',
      pl: 'Oferty',
    },
  },
  admin: {
    useAsTitle: 'title',
    group: adminGroups.featured,
    // Hide offers for clients
    hidden: ({ user }) => !isClientRoleEqualOrHigher('service-provider', user),

    defaultColumns: ['title', 'updatedAt', '_status', 'user'],

    // hide api url in admin panel
    hideAPIURL: true,
  },

  versions: {
    drafts: {
      autosave: true,
      // schedulePublish: true,
    },
  },
  access: {
    // admin see everything
    create: providerOrHigher, // providers and highers can create
    read: moderatorOrHigherOrSelf('user'), // everyone should be able to see the offer
    update: moderatorOrHigherOrSelf('user'), // mods, admins, and owners
    delete: adminOrHigherOrSelf('user'), // only admins or owners of document
  },

  fields: [
    // Admin fields
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
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Nowa oferta',
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
    },
  ],
}
