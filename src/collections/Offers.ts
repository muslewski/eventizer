import {
  adminOrHigherOrSelf,
  moderatorOrHigher,
  moderatorOrHigherOrSelf,
  providerOrHigher,
} from '@/access'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'

// TODO:
// [] Add live preview feature for offers in the admin panel
// [] Add ai payload plugin

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
  orderable: true,
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
    read: ({ req: { user } }) => {
      // If no user, allow public read (for viewing images)
      if (!user) return true

      // Moderators and above can see all
      if (isClientRoleEqualOrHigher('moderator', user)) return true

      // Regular users only see their own offers
      return {
        user: {
          equals: user.id,
        },
      }
    },
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
      localized: true,
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
    },
  ],
}
