import { adminOrHigher, providerOrHigher } from '@/access'
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'

export const StripeCustomers: CollectionConfig = {
  slug: 'stripe-customers',
  labels: {
    singular: {
      en: 'Stripe Customer',
      pl: 'Klient Stripe',
    },
    plural: {
      en: 'Stripe Customers',
      pl: 'Klienci Stripe',
    },
  },
  hooks: {
    beforeChange: [
      // dummy ro console log
      async ({ data, req }) => {
        if (data && data.email) {
          const users = await req.payload.find({
            collection: 'users',
            where: {
              email: { equals: data.email },
            },
            limit: 1,
            req,
          })

          const user = users?.docs?.[0]

          // Only set user if found
          if (user) data.user = user.id
        }

        return data
      },
    ],
  },
  admin: {
    description: {
      en: 'Read customer data here, but logic should be configured in the Stripe Dashboard.',
      pl: 'Odczytuj dane klientów tutaj, ale logika powinna być konfigurowana w panelu Stripe.',
    },
    useAsTitle: 'email',
    group: adminGroups.settings,
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    defaultColumns: ['email', 'price', 'level', 'createdAt'],
  },
  access: {
    create: () => false,
    read: adminOrHigher,
    // update: () => false,
    delete: adminOrHigher,
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'business_name',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
