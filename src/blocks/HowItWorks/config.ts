import type { Block, Field } from 'payload'

const createStepGroup = (stepNumber: number): Field => ({
  name: `step${stepNumber}`,
  type: 'group',
  label: {
    en: `Step ${stepNumber}`,
    pl: `Krok ${stepNumber}`,
  },
  fields: [
    {
      name: 'header',
      type: 'text',
      required: true,
      label: {
        en: 'Header',
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
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: {
        en: 'Media',
        pl: 'Media',
      },
    },
  ],
})

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
          fields: [createStepGroup(1), createStepGroup(2)],
        },
        {
          name: 'serviceProvider',
          label: {
            en: 'Service Provider',
            pl: 'Usługodawca',
          },
          fields: [createStepGroup(1), createStepGroup(2)],
        },
      ],
    },
  ],
}
