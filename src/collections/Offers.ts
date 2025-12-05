import {
  adminOrHigherOrSelf,
  moderatorOrHigherOrSelf,
  providerOrHigher,
  publicAccess,
} from '@/access'
import type { CollectionConfig } from 'payload'

export const Offers: CollectionConfig = {
  slug: 'offers',

  access: {
    // admin see everything
    create: providerOrHigher, // providers and highers can create
    read: publicAccess, // everyone should be able to see the offer
    update: moderatorOrHigherOrSelf, // mods, admins, and owners
    delete: adminOrHigherOrSelf, // only admins or owners of document
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
