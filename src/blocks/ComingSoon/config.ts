import type { Block } from 'payload'

export const ComingSoon: Block = {
  slug: 'comingSoon',
  interfaceName: 'ComingSoonBlock',
  labels: {
    singular: 'Coming Soon',
    plural: 'Coming Soon Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Już wkrótce',
      required: true,
      admin: {
        description: 'Main heading text (uses Bebas font)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue: 'Prace nad tą podstroną ciągle trwają. Wróć niedługo, aby zobaczyć co nowego!',
      required: true,
      admin: {
        description: 'Descriptive paragraph text',
      },
    },
    {
      name: 'icon',
      type: 'select',
      defaultValue: 'construction',
      options: [
        { label: 'Construction', value: 'construction' },
        { label: 'Clock', value: 'clock' },
        { label: 'Rocket', value: 'rocket' },
        { label: 'Sparkles', value: 'sparkles' },
        { label: 'Hammer', value: 'hammer' },
      ],
      admin: {
        description: 'Icon to display',
      },
    },
  ],
}
