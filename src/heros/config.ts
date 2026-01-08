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
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
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

    // Specific for Medium Impact Hero
    {
      type: 'collapsible',
      label: {
        en: 'Statistics',
        pl: 'Statystyki',
      },
      admin: {
        condition: (_, siblingData) => siblingData.type === 'mediumImpact',
        description: {
          en: "For example: '500+ attendees', '50+ speakers', etc.",
          pl: "Na przykład: '500+ uczestników', '50+ prelegentów', itd.",
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'informationTitle1',
              type: 'text',
              label: {
                en: 'Information Title 1',
                pl: 'Tytuł Informacji 1',
              },
              localized: true,
            },
            {
              name: 'informationValue1',
              type: 'text',
              label: {
                en: 'Information Value 1',
                pl: 'Wartość Informacji 1',
              },
              localized: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'informationTitle2',
              type: 'text',
              label: {
                en: 'Information Title 2',
                pl: 'Tytuł Informacji 2',
              },
              localized: true,
            },
            {
              name: 'informationValue2',
              type: 'text',
              label: {
                en: 'Information Value 2',
                pl: 'Wartość Informacji 2',
              },
              localized: true,
            },
          ],
        },
      ],
    },
  ],
}
