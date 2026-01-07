import { linkGroup } from '@/fields/linkGroup'
import { Field } from 'payload'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'highImpact',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
      ],
    },
    {
      localized: true,
      name: 'title',
      type: 'text',
      label: {
        pl: 'Nagłówek',
        en: 'Header',
      },
      required: true,
    },
    linkGroup({
      overrides: {
        localized: true,
        maxRows: 2,
      },
    }),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',

      label: {
        pl: 'Tło',
        en: 'Background Image',
      },
    },
    {
      name: 'showScrollIndicator',
      type: 'checkbox',
      label: {
        pl: 'Pokaż wskaźnik przewijania',
        en: 'Show Scroll Indicator',
      },
      defaultValue: false,
    },
  ],
}
