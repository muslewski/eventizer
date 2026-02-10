import type { Block } from 'payload'

/**
 * MediaBlock configured for offers — uploads go to the 'offer-uploads' collection
 * so they follow the same storage pattern as mainImage and backgroundImage.
 */
export const OfferMediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'OfferMediaBlock',
  labels: {
    singular: {
      en: 'Media',
      pl: 'Media',
    },
    plural: {
      en: 'Media Blocks',
      pl: 'Bloki Media',
    },
  },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'offer-uploads',
      required: true,
      label: {
        en: 'Media',
        pl: 'Media',
      },
    },
  ],
}
