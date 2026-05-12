import { adminOrHigher } from '@/access'
import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'

export const ProcessedStripeEvents: CollectionConfig = {
  slug: 'processed-stripe-events',
  labels: {
    singular: { en: 'Processed Stripe Event', pl: 'Przetworzone zdarzenie Stripe' },
    plural: { en: 'Processed Stripe Events', pl: 'Przetworzone zdarzenia Stripe' },
  },
  admin: {
    useAsTitle: 'eventId',
    group: adminGroups.settings,
    description: {
      en: 'Audit + idempotency record for Stripe subscription events. Cleaned daily after 30 days.',
      pl: 'Rejestr audytu i idempotencji dla zdarzeń subskrypcji Stripe. Czyszczony codziennie po 30 dniach.',
    },
    defaultColumns: ['eventId', 'eventType', 'user', 'changeType', 'processedAt'],
  },
  access: {
    read: adminOrHigher,
    create: () => false, // Only written by webhook handlers via overrideAccess
    update: () => false,
    delete: adminOrHigher, // Cron deletes via overrideAccess
  },
  fields: [
    { name: 'eventId', type: 'text', required: true, unique: true, index: true },
    { name: 'eventType', type: 'text', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'subscriptionId', type: 'text' },
    {
      name: 'changeType',
      type: 'select',
      options: ['upgrade', 'downgrade', 'lateral', 'interval_only', 'no_change', 'other'],
    },
    { name: 'prevPlanSlug', type: 'text' },
    { name: 'newPlanSlug', type: 'text' },
    { name: 'prevLevel', type: 'number' },
    { name: 'newLevel', type: 'number' },
    { name: 'draftedByCategory', type: 'number', defaultValue: 0 },
    { name: 'draftedByLimit', type: 'number', defaultValue: 0 },
    { name: 'processedAt', type: 'date', required: true, defaultValue: () => new Date() },
  ],
}
