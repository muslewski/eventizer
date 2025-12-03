import { adminOnly } from '@/access/adminOnly'
import type { CollectionConfig } from 'payload'

export const Offers: CollectionConfig = {
  slug: 'offers',

  access: {
    // admin see everything
    create: adminOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
