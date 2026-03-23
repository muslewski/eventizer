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
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: '16:9',
      label: {
        en: 'Aspect Ratio',
        pl: 'Proporcje wideo',
      },
      options: [
        { label: { en: 'Landscape (16:9)', pl: 'Poziome (16:9)' }, value: '16:9' },
        { label: { en: 'Vertical (9:16)', pl: 'Pionowe (9:16)' }, value: '9:16' },
        { label: { en: 'Square (1:1)', pl: 'Kwadratowe (1:1)' }, value: '1:1' },
      ],
      admin: {
        description: {
          en: 'Choose the aspect ratio that matches your video.',
          pl: 'Wybierz proporcje odpowiadające Twojemu wideo.',
        },
      },
    },
  ],
}
