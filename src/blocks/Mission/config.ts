import type { Block } from 'payload'

export const Mission: Block = {
  slug: 'mission',
  interfaceName: 'MissionBlock',
  labels: {
    singular: {
      en: 'Mission',
      pl: 'Misja',
    },
    plural: {
      en: 'Mission Blocks',
      pl: 'Bloki Misji',
    },
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'O nas',
      required: true,
      label: {
        en: 'Badge Text',
        pl: 'Tekst odznaki',
      },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Co nas napędza',
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
        'Branża eventowa w Polsce działa na starych zasadach — szukanie usługodawców to godziny scrollowania, dzwonienia i porównywania ofert na własną rękę. Chcemy to zmienić. Eventizer powstał, żeby uprościć relację między usługodawcami a klientami szukającymi niezapomnianych doświadczeń.',
      required: true,
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'secondaryDescription',
      type: 'textarea',
      defaultValue:
        'Wierzymy, że najlepsze wydarzenia zaczynają się od łatwego dostępu do sprawdzonych profesjonalistów. Dlatego budujemy miejsce, gdzie jedno kliknięcie wystarczy, by znaleźć idealnego fotografa, DJ-a czy catering.',
      label: {
        en: 'Secondary Description',
        pl: 'Dodatkowy opis',
      },
    },
    {
      name: 'values',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 5,
      label: {
        en: 'Core Values',
        pl: 'Główne wartości',
      },
      admin: {
        description: {
          en: 'Core values displayed as stacked cards on the right',
          pl: 'Wartości wyświetlane jako karty po prawej stronie',
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
            { label: 'Sparkles', value: 'sparkles' },
            { label: 'Eye', value: 'eye' },
            { label: 'Handshake', value: 'handshake' },
            { label: 'Lightbulb', value: 'lightbulb' },
            { label: 'Heart', value: 'heart' },
            { label: 'Shield', value: 'shield' },
            { label: 'Target', value: 'target' },
            { label: 'Zap', value: 'zap' },
            { label: 'Compass', value: 'compass' },
            { label: 'Globe', value: 'globe' },
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
        {
          name: 'accentColor',
          type: 'select',
          defaultValue: 'primary',
          label: {
            en: 'Accent Color',
            pl: 'Kolor akcentu',
          },
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Accent', value: 'accent' },
            { label: 'Blue', value: 'blue' },
            { label: 'Emerald', value: 'emerald' },
            { label: 'Violet', value: 'violet' },
            { label: 'Rose', value: 'rose' },
          ],
        },
      ],
      defaultValue: [
        {
          icon: 'sparkles',
          title: 'Prostota',
          description:
            'Koniec z chaosem. Jedno miejsce, przejrzysty katalog i inteligentne wyszukiwanie — znajdziesz idealną ofertę w minuty, nie godziny.',
          accentColor: 'primary',
        },
        {
          icon: 'eye',
          title: 'Transparentność',
          description:
            'Jasne ceny, prawdziwe opinie, zweryfikowane profile. Żadnych ukrytych kosztów — wiesz dokładnie, za co płacisz.',
          accentColor: 'blue',
        },
        {
          icon: 'handshake',
          title: 'Dostępność',
          description:
            'Każdy usługodawca, niezależnie od wielkości, ma szansę dotrzeć do klientów. Wyrównujemy szanse na rynku eventowym.',
          accentColor: 'emerald',
        },
      ],
    },
  ],
}
