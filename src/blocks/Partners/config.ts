import type { Block } from 'payload'

export const Partners: Block = {
  slug: 'partners',
  interfaceName: 'PartnersBlock',
  labels: {
    singular: {
      en: 'Partners',
      pl: 'Partnerzy',
    },
    plural: {
      en: 'Partners Blocks',
      pl: 'Bloki Partnerów',
    },
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'Partnerzy',
      required: true,
      label: {
        en: 'Badge Text',
        pl: 'Tekst odznaki',
      },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Partnerzy Eventizera',
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
        'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'rotationSeconds',
      type: 'number',
      defaultValue: 8,
      min: 0,
      max: 60,
      label: {
        en: 'Spotlight rotation (seconds)',
        pl: 'Rotacja wyróżnienia (sekundy)',
      },
      admin: {
        description: {
          en: 'How long each partner stays in the spotlight. Set to 0 to disable auto-rotation.',
          pl: 'Jak długo każdy partner pozostaje w centrum uwagi. Ustaw 0, aby wyłączyć rotację.',
        },
      },
    },
    {
      name: 'partners',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 12,
      label: {
        en: 'Partners',
        pl: 'Partnerzy',
      },
      admin: {
        description: {
          en: 'Each partner can optionally link to their offer on Eventizer or to an external website.',
          pl: 'Każdy partner może opcjonalnie linkować do swojej oferty na Eventizerze lub do strony zewnętrznej.',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: {
            en: 'Partner Name',
            pl: 'Nazwa partnera',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          label: {
            en: 'Tagline',
            pl: 'Podtytuł',
          },
          admin: {
            description: {
              en: 'Short city/category descriptor shown next to the name, e.g. "Białystok" or "DJ na wesela".',
              pl: 'Krótki opis (miasto/kategoria) wyświetlany obok nazwy, np. "Białystok" lub "DJ na wesela".',
            },
          },
        },
        {
          name: 'quote',
          type: 'textarea',
          label: {
            en: 'Spotlight quote / description',
            pl: 'Cytat / opis w wyróżnieniu',
          },
          admin: {
            description: {
              en: 'Optional short blurb shown when this partner is in the spotlight.',
              pl: 'Opcjonalny krótki opis wyświetlany gdy partner jest w centrum uwagi.',
            },
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: {
            en: 'Logo',
            pl: 'Logo',
          },
          admin: {
            description: {
              en: 'Optional. Falls back to a stylized initial if not provided.',
              pl: 'Opcjonalne. Wyświetlany jest inicjał, jeśli nie ustawione.',
            },
          },
        },
        {
          name: 'accentColor',
          type: 'select',
          defaultValue: 'primary',
          label: {
            en: 'Accent Color',
            pl: 'Kolor akcentu',
          },
          options: [
            { label: 'Primary (gold)', value: 'primary' },
            { label: 'Accent', value: 'accent' },
            { label: 'Blue', value: 'blue' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Violet', value: 'violet' },
            { label: 'Rose', value: 'rose' },
          ],
        },
        {
          name: 'linkType',
          type: 'radio',
          defaultValue: 'none',
          label: {
            en: 'Link Type',
            pl: 'Typ linku',
          },
          options: [
            { label: { en: 'No link', pl: 'Brak linku' }, value: 'none' },
            { label: { en: 'Offer on Eventizer', pl: 'Oferta na Eventizerze' }, value: 'offer' },
            { label: { en: 'External URL', pl: 'Zewnętrzny URL' }, value: 'external' },
          ],
          admin: {
            layout: 'horizontal',
          },
        },
        {
          name: 'offer',
          type: 'relationship',
          relationTo: 'offers',
          label: {
            en: 'Offer',
            pl: 'Oferta',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === 'offer',
            description: {
              en: 'Pick the partner’s offer on Eventizer.',
              pl: 'Wybierz ofertę partnera na Eventizerze.',
            },
          },
        },
        {
          name: 'externalUrl',
          type: 'text',
          label: {
            en: 'External URL',
            pl: 'Zewnętrzny URL',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === 'external',
            placeholder: 'https://...',
          },
        },
      ],
      defaultValue: [
        {
          name: 'SkyClub Białystok',
          tagline: 'Białystok',
          accentColor: 'primary',
          linkType: 'none',
        },
        {
          name: 'Meetly',
          tagline: 'Platforma eventowa',
          accentColor: 'blue',
          linkType: 'none',
        },
        {
          name: 'Apartamenty Zielona Lipka',
          tagline: 'Noclegi i eventy',
          accentColor: 'emerald',
          linkType: 'none',
        },
        {
          name: 'Apartamenty pod Gromadzyniem',
          tagline: 'Noclegi i eventy',
          accentColor: 'violet',
          linkType: 'none',
        },
        {
          name: 'Princess Palace Gdańsk',
          tagline: 'Gdańsk',
          accentColor: 'rose',
          linkType: 'none',
        },
        {
          name: 'DJ SPDR',
          tagline: 'Muzyka i rozrywka',
          accentColor: 'accent',
          linkType: 'none',
        },
      ],
    },
  ],
}
