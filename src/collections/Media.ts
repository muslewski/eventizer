import { adminOnly } from '@/access/adminOnly'
import { adminOrSelf } from '@/access/adminOrSelf'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: adminOnly,
    update: adminOrSelf,
    delete: adminOrSelf,
    create: adminOnly,
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
