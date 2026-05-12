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
    description: {
      en: 'Manage subscription plan content and display settings. Plan pricing and billing logic should be configured in the Stripe Dashboard.',
      pl: 'Zarządzaj treścią i ustawieniami wyświetlania planów subskrypcji. Ceny i logika rozliczeń powinny być konfigurowane w panelu Stripe.',
    },
    useAsTitle: 'name',
    group: adminGroups.settings,
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    defaultColumns: ['name', 'ProductDetails', 'level'],
  },
  access: {
    read: publicAccess,
    // plans should be created via Stripe only throw api message
    create: () => false,
    update: adminOrHigher,
    delete: adminOrHigher,
  },
  fields: [
    {
      name: 'ProductDetails',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/payload/fields/stripeProductDetails',
          Cell: '/components/payload/cells/stripeProductDetails',
        },
      },
    },
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
      required: false,
      unique: true,
      label: 'Slug',
      admin: {
        description: {
          en: "Unique identifier (e.g., 'basic', 'pro', 'enterprise'). Auto-created plans from Stripe sync arrive without a slug — set it here before the plan is referenced.",
          pl: "Unikalny identyfikator (np. 'basic', 'pro', 'enterprise'). Plany utworzone automatycznie ze Stripe nie mają sluga — ustaw go tutaj przed użyciem planu.",
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
    // {
    //   name: 'price',
    //   type: 'number',
    //   required: true,
    //   min: 0,
    //   label: {
    //     en: 'Price (PLN/month)',
    //     pl: 'Cena (PLN/miesiąc)',
    //   },
    //   admin: {
    //     position: 'sidebar',
    //   },
    // },
    {
      name: 'level',
      type: 'number',
      required: false,
      min: 0,
      admin: {
        position: 'sidebar',
        description: {
          en: "Defines the hierarchy of plans. Higher levels include access to lower level plans' features. Auto-created plans from Stripe sync arrive without a level — set it here before the plan is referenced.",
          pl: 'Definiuje hierarchię planów. Wyższe poziomy obejmują dostęp do funkcji planów o niższym poziomie. Plany utworzone automatycznie ze Stripe nie mają poziomu — ustaw go tutaj przed użyciem planu.',
        },
      },
    },
    {
      name: 'maxOffers',
      type: 'number',
      required: false,
      min: 1,
      defaultValue: 1,
      label: { en: 'Max Offers', pl: 'Limit Ofert' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'How many offers a subscriber to this plan can own (drafts + published). Falls back to 1 if not set.',
          pl: 'Ile ofert może mieć subskrybent tego planu (wersje robocze + opublikowane). Domyślnie 1, jeśli nie ustawione.',
        },
      },
    },
    {
      name: 'maxOffers',
      type: 'number',
      required: false,
      min: 1,
      defaultValue: 1,
      label: { en: 'Max Offers', pl: 'Limit Ofert' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'How many offers a subscriber to this plan can own (drafts + published). Falls back to 1 if not set.',
          pl: 'Ile ofert może mieć subskrybent tego planu (wersje robocze + opublikowane). Domyślnie 1, jeśli nie ustawione.',
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
      labels: {
        singular: {
          en: 'Feature',
          pl: 'Funkcja',
        },
        plural: {
          en: 'Features',
          pl: 'Funkcje',
        },
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
