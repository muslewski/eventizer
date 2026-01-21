import { Block } from 'payload'

export const Dummy: Block = {
  slug: 'dummy',
  interfaceName: 'dummyBlock',
  labels: {
    singular: {
      en: 'Example Block',
      pl: 'Przykładowy blok',
    },
    plural: {
      en: 'Example Blocks',
      pl: 'Przykładowe bloki',
    },
  },
  fields: [
    {
      name: 'exampleText',
      type: 'text',
      label: { en: 'Example Text', pl: 'Przykładowy tekst' },
    },
  ],
}
