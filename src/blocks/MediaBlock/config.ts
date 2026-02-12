import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
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
    },
  ],
}
