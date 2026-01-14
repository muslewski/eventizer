import type { Block, Field } from 'payload'

const stepFields: Field[] = [
  {
    name: 'stepOneHeader',
    type: 'text',
    required: true,
    label: {
      en: 'Step 1 Header',
      pl: 'Nagłówek kroku 1',
    },
  },
  {
    name: 'stepOneDescription',
    type: 'textarea',
    required: true,
    label: {
      en: 'Step 1 Description',
      pl: 'Opis kroku 1',
    },
  },
  {
    name: 'stepOneMedia',
    type: 'upload',
    relationTo: 'media',
    label: {
      en: 'Step 1 Media',
      pl: 'Media kroku 1',
    },
  },
  {
    name: 'stepTwoHeader',
    type: 'text',
    required: true,
    label: {
      en: 'Step 2 Header',
      pl: 'Nagłówek kroku 2',
    },
  },
  {
    name: 'stepTwoDescription',
    type: 'textarea',
    required: true,
    label: {
      en: 'Step 2 Description',
      pl: 'Opis kroku 2',
    },
  },
  {
    name: 'stepTwoMedia',
    type: 'upload',
    relationTo: 'media',
    label: {
      en: 'Step 2 Media',
      pl: 'Media kroku 2',
    },
  },
]

export const HowItWorks: Block = {
  slug: 'howItWorks',
  interfaceName: 'HowItWorksBlock',
  labels: {
    singular: {
      en: 'How It Works',
      pl: 'Jak to działa',
    },
    plural: {
      en: 'How It Works',
      pl: 'Jak to działa',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'client',
          label: {
            en: 'Client',
            pl: 'Klient',
          },
          fields: stepFields.map((field) => ({
            ...field,
            name: `client${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}`,
          })),
        },
        {
          name: 'serviceProvider',
          label: {
            en: 'Service Provider',
            pl: 'Usługodawca',
          },
          fields: stepFields.map((field) => ({
            ...field,
            name: `serviceProvider${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}`,
          })),
        },
      ],
    },
  ],
}
