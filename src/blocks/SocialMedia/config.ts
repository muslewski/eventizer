import type { Block, Field } from 'payload'

const createSocialField = (
  name: string,
  labelEn: string,
  labelPl: string,
  placeholderUrl: string,
): Field => ({
  name,
  type: 'group',
  label: {
    en: labelEn,
    pl: labelPl,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: {
        en: 'Enable',
        pl: 'Włącz',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      label: {
        en: 'Profile URL',
        pl: 'Adres URL profilu',
      },
      admin: {
        placeholder: placeholderUrl,
        condition: (data, siblingData) => siblingData?.enabled,
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
      admin: {
        description: {
          en: 'Optional description shown below the social icon',
          pl: 'Opcjonalny opis wyświetlany pod ikoną',
        },
        condition: (data, siblingData) => siblingData?.enabled,
      },
    },
  ],
})

export const SocialMedia: Block = {
  slug: 'socialMedia',
  interfaceName: 'SocialMediaBlock',
  labels: {
    singular: {
      en: 'Social Media',
      pl: 'Media społecznościowe',
    },
    plural: {
      en: 'Social Media Blocks',
      pl: 'Bloki mediów społecznościowych',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Bądźmy w kontakcie',
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      defaultValue:
        'Śledź nas w mediach społecznościowych, aby być na bieżąco z najnowszymi wydarzeniami, inspiracjami i ofertami specjalnymi.',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      type: 'collapsible',
      label: {
        en: 'Social Platforms',
        pl: 'Platformy społecznościowe',
      },
      admin: {
        initCollapsed: false,
      },
      fields: [
        createSocialField(
          'instagram',
          'Instagram',
          'Instagram',
          'https://instagram.com/your_profile',
        ),
        createSocialField('facebook', 'Facebook', 'Facebook', 'https://facebook.com/your_page'),
        createSocialField('tiktok', 'TikTok', 'TikTok', 'https://tiktok.com/@your_profile'),
        createSocialField('twitter', 'X (Twitter)', 'X (Twitter)', 'https://x.com/your_profile'),
      ],
    },
  ],
}
