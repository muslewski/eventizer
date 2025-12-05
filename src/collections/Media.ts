import { adminOrHigher } from '@/access'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: adminOrHigher,
    update: adminOrHigher,
    delete: adminOrHigher,
    create: adminOrHigher,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
