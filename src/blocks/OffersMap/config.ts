import type { Block } from 'payload'

export const OffersMap: Block = {
  slug: 'offersMap',
  interfaceName: 'OffersMapBlock',
  labels: {
    singular: {
      en: 'Offers Map',
      pl: 'Mapa Ofert',
    },
    plural: {
      en: 'Offers Maps',
      pl: 'Mapy Ofert',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Wszystkie oferty na mapie',
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      defaultValue: 'Zobacz gdzie działają nasi usługodawcy w całej Polsce',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
  ],
}
