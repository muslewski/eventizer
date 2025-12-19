import { adminOrHigher, publicAccess } from '@/access'
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'

export const SubscriptionPlans: CollectionConfig = {
  slug: 'subscription-plans',
  labels: {
    singular: {
      en: 'Subscription Plan',
      pl: 'Plan Subskrypcji',
    },
    plural: {
      en: 'Subscription Plans',
      pl: 'Plany Subskrypcji',
    },
  },
  admin: {
    useAsTitle: 'name',
    group: adminGroups.settings,
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    defaultColumns: ['name', 'price', 'createdAt'],
  },
  access: {
    read: publicAccess,
    create: adminOrHigher,
    update: adminOrHigher,
    delete: adminOrHigher,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: {
        en: 'Name',
        pl: 'Nazwa',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        description: {
          en: "Unique identifier (e.g., 'basic', 'pro', 'enterprise')",
          pl: "Unikalny identyfikator (np. 'basic', 'pro', 'enterprise')",
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      label: {
        en: 'Price (PLN/month)',
        pl: 'Cena (PLN/miesiąc)',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'level',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
        description: {
          en: "Defines the hierarchy of plans. Higher levels include access to lower level plans' features.",
          pl: 'Definiuje hierarchię planów. Wyższe poziomy obejmują dostęp do funkcji planów o niższym poziomie.',
        },
      },
    },
    {
      name: 'highlighted',
      type: 'checkbox',
      label: {
        en: 'Highlight (Most Popular)',
        pl: 'Wyróżnij (Najpopularniejszy)',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'features',
      type: 'array',
      label: {
        en: 'Features List',
        pl: 'Lista Funkcji',
      },
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
          label: {
            en: 'Feature',
            pl: 'Funkcja',
          },
        },
        {
          name: 'included',
          type: 'checkbox',
          defaultValue: true,
          label: {
            en: 'Included',
            pl: 'Włączone',
          },
        },
      ],
    },
  ],
}
