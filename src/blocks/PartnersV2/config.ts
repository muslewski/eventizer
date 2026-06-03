import type { Block } from 'payload'

export const PartnersV2: Block = {
  slug: 'partnersV2',
  interfaceName: 'PartnersV2Block',
  labels: {
    singular: { en: 'Partners V2', pl: 'Partnerzy V2' },
    plural: { en: 'Partners V2 Blocks', pl: 'Bloki Partnerów V2' },
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'Partnerzy',
      required: true,
      label: { en: 'Badge Text', pl: 'Tekst odznaki' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Partnerzy Eventizera',
      required: true,
      label: { en: 'Heading', pl: 'Nagłówek' },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Współpracujemy z zaufanymi miejscami i twórcami, którzy pomagają nam tworzyć niezapomniane wydarzenia. Poznaj naszych partnerów i sprawdź ich oferty na Eventizerze.',
      label: { en: 'Description', pl: 'Opis' },
    },
    {
      name: 'rotationSeconds',
      type: 'number',
      defaultValue: 8,
      min: 0,
      max: 60,
      label: { en: 'Spotlight rotation (seconds)', pl: 'Rotacja wyróżnienia (sekundy)' },
      admin: {
        description: {
          en: 'How long each partner stays in the spotlight. Set to 0 to disable auto-rotation.',
          pl: 'Jak długo każdy partner pozostaje w centrum uwagi. Ustaw 0, aby wyłączyć rotację.',
        },
      },
    },
    {
      name: 'partners',
      type: 'relationship',
      relationTo: 'partners',
      hasMany: true,
      required: true,
      minRows: 2,
      label: { en: 'Partners', pl: 'Partnerzy' },
      admin: {
        description: {
          en: 'Pick partners from the Partnerzy Eventizer collection. Order here = display order.',
          pl: 'Wybierz partnerów z kolekcji Partnerzy Eventizer. Kolejność tutaj = kolejność wyświetlania.',
        },
      },
    },
  ],
}
