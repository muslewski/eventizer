import type { Block } from 'payload'

export const ServiceCategoriesBlock: Block = {
  slug: 'serviceCategories',
  interfaceName: 'ServiceCategoriesBlock',
  labels: {
    singular: {
      en: 'Service Categories',
      pl: 'Kategorie Usług',
    },
    plural: {
      en: 'Service Categories',
      pl: 'Kategorie Usług',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Nasze kategorie',
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      defaultValue: 'Znajdź idealne usługi dla Twojego wydarzenia',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'service-categories',
      hasMany: true,
      required: true,
      label: {
        en: 'Categories',
        pl: 'Kategorie',
      },
      admin: {
        description: {
          en: 'Select the service categories to display in this block',
          pl: 'Wybierz kategorie usług, które mają być wyświetlane w tym bloku',
        },
      },
    },
  ],
}
