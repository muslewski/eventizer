import type { Block } from 'payload'

export const FeaturedOffers: Block = {
  slug: 'featuredOffers',
  interfaceName: 'FeaturedOffersBlock',
  labels: {
    singular: {
      en: 'Featured Offer',
      pl: 'Polecana oferta',
    },
    plural: {
      en: 'Featured Offers',
      pl: 'Polecane oferty',
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
      name: 'offers',
      type: 'relationship',
      relationTo: 'offers',

      hasMany: true,
      required: true,
      label: {
        en: 'Offers',
        pl: 'Oferty',
      },
      admin: {
        description: {
          en: 'Select the offers to feature',
          pl: 'Wybierz oferty do wyróżnienia',
        },
      },
    },
  ],
}
