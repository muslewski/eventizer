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
    {
      name: 'orientation',
      type: 'select',
      label: {
        en: 'Image Orientation',
        pl: 'Orientacja Zdjęcia',
      },
      defaultValue: 'landscape',
      options: [
        { label: { en: 'Landscape', pl: 'Poziome' }, value: 'landscape' },
        { label: { en: 'Portrait', pl: 'Pionowe' }, value: 'portrait' },
        { label: { en: 'Square', pl: 'Kwadratowe' }, value: 'square' },
      ],
      admin: {
        description: {
          en: 'Choose how the image should be displayed.',
          pl: 'Wybierz, jak zdjęcie powinno być wyświetlane.',
        },
      },
    },
  ],
}
