import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'

export const HelpTickets: CollectionConfig = {
  slug: 'help-tickets',
  labels: {
    singular: {
      en: 'Help Ticket',
      pl: 'Zgłoszenie Pomocy',
    },
    plural: {
      en: 'Help Tickets',
      pl: 'Zgłoszenia Pomocy',
    },
  },
  admin: {
    group: adminGroups.help,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
  ],
}
