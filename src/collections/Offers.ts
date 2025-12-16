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
      access: {
        read: fieldRoleOrHigher('moderator'), // Only mods and admins can see who created the offer
        update: fieldRoleOrHigher('admin'), // Only admins can change the owner
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
    },
  ],
}
