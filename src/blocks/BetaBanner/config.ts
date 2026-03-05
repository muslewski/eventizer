import type { Block } from 'payload'

export const BetaBanner: Block = {
  slug: 'betaBanner',
  interfaceName: 'BetaBannerBlock',
  labels: {
    singular: {
      en: 'Beta Banner',
      pl: 'Baner Beta',
    },
    plural: {
      en: 'Beta Banners',
      pl: 'Banery Beta',
    },
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'Faza Beta',
      required: true,
      label: {
        en: 'Badge Text',
        pl: 'Tekst odznaki',
      },
      admin: {
        description: {
          en: 'Small badge label displayed above the heading',
          pl: 'Mały tekst wyświetlany nad nagłówkiem',
        },
      },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Dodaj swoje ogłoszenie za darmo!',
      required: true,
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Jesteśmy w fazie beta — to najlepszy moment, żeby dołączyć! Dodaj swoją ofertę i dotrzyj do nowych klientów, zanim inni zdążą zareagować.',
      required: true,
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'benefits',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      label: {
        en: 'Benefits',
        pl: 'Korzyści',
      },
      admin: {
        description: {
          en: 'List of benefits shown as feature cards',
          pl: 'Lista korzyści wyświetlanych jako karty',
        },
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          label: {
            en: 'Icon',
            pl: 'Ikona',
          },
          options: [
            { label: 'Zap (lightning)', value: 'zap' },
            { label: 'Gift', value: 'gift' },
            { label: 'Shield', value: 'shield' },
            { label: 'TrendingUp', value: 'trendingUp' },
            { label: 'Users', value: 'users' },
            { label: 'Star', value: 'star' },
            { label: 'Clock', value: 'clock' },
            { label: 'Rocket', value: 'rocket' },
            { label: 'Heart', value: 'heart' },
            { label: 'Eye', value: 'eye' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: {
            en: 'Title',
            pl: 'Tytuł',
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
      ],
      defaultValue: [
        {
          icon: 'gift',
          title: '100% za darmo',
          description:
            'Podczas fazy beta możesz dodawać oferty bez żadnych opłat. Korzystaj z pełni możliwości platformy.',
        },
        {
          icon: 'zap',
          title: 'Szybki start',
          description:
            'Zarejestruj się, uzupełnij profil i dodaj swoje ogłoszenie w kilka minut. Bez zbędnych formalności.',
        },
        {
          icon: 'trendingUp',
          title: 'Bądź pierwszy',
          description:
            'Dołącz zanim otworzymy się na rynek. Zbuduj swoją pozycję i zbieraj opinie od pierwszych klientów.',
        },
        {
          icon: 'shield',
          title: 'Bez zobowiązań',
          description:
            'Nie pobieramy żadnych opłat. Możesz przetestować platformę bez ryzyka — usuń ofertę kiedy chcesz.',
        },
      ],
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Dodaj ofertę za darmo',
      required: true,
      label: {
        en: 'CTA Button Label',
        pl: 'Tekst przycisku CTA',
      },
    },
    {
      name: 'ctaLink',
      type: 'text',
      defaultValue: '/app',
      required: true,
      label: {
        en: 'CTA Button Link',
        pl: 'Link przycisku CTA',
      },
      admin: {
        description: {
          en: 'URL the button links to',
          pl: 'URL do którego prowadzi przycisk',
        },
      },
    },
    {
      name: 'footnote',
      type: 'text',
      defaultValue: 'Bez karty kredytowej • Bez zobowiązań • Darmowe w fazie beta',
      label: {
        en: 'Footnote',
        pl: 'Przypis',
      },
      admin: {
        description: {
          en: 'Small text displayed below the CTA button',
          pl: 'Mały tekst wyświetlany pod przyciskiem CTA',
        },
      },
    },
  ],
}
