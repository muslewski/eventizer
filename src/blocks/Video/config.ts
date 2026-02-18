import type { Block } from 'payload'

export const Video: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: {
    singular: {
      en: 'Video',
      pl: 'Wideo',
    },
    plural: {
      en: 'Videos',
      pl: 'Wideo',
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
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: {
        en: 'Video File',
        pl: 'Plik wideo',
      },
      admin: {
        description: {
          en: 'Upload an MP4 or WebM video file.',
          pl: 'Prześlij plik wideo w formacie MP4 lub WebM.',
        },
      },
    },
  ],
}
