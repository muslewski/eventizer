import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig, Field } from 'payload'

// Common fields shared by all levels of categories
const commonCategoryFields: Field[] = [
  {
    name: 'name',
    type: 'text',
    required: true,
    label: {
      en: 'Category Name',
      pl: 'Nazwa Kategorii',
    },
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    label: 'Slug',
    admin: {
      position: 'sidebar',
      description: {
        en: "Unique identifier (e.g., 'dj', 'catering')",
        pl: "Unikalny identyfikator (np. 'dj', 'catering')",
      },
    },
  },
  {
    name: 'requiredPlan',
    type: 'relationship',
    relationTo: 'subscription-plans',
    label: {
      en: 'Required Subscription Plan',
      pl: 'Wymagany Plan Subskrypcji',
    },
    admin: {
      position: 'sidebar',
      description: {
        en: 'Select the subscription plan required to access services in this category.',
        pl: 'Wybierz plan subskrypcji wymagany do uzyskania dostępu do usług w tej kategorii',
      },
    },
  },
  {
    name: 'description',
    type: 'textarea',
    label: {
      en: 'Description',
      pl: 'Opis',
    },
  },
  // Add icon field
]

// Fields only for root categories
const rootOnlyFields: Field[] = []

// Factory that adds subcategories to the same fields up to maxDepth
const createCategoryFields = (maxDepth: number, currentDepth: number = 0): Field[] => {
  // Root level gets all fields, subcategories only get common fields
  const fields =
    currentDepth === 0 ? [...commonCategoryFields, ...rootOnlyFields] : [...commonCategoryFields]

  if (currentDepth < maxDepth) {
    // Use unique name for each level to avoid conflicts
    const subcategoryFieldName = `subcategory_level_${currentDepth + 1}`

    fields.push({
      name: subcategoryFieldName,

      type: 'array',
      labels: {
        singular: {
          en: currentDepth === 0 ? 'Subcategory' : `Level ${currentDepth + 1} Subcategory`,
          pl: currentDepth === 0 ? 'Podkategoria' : `Kategoria Poziomu ${currentDepth + 1}`,
        },
        plural: {
          en: currentDepth === 0 ? 'Subcategories' : `Level ${currentDepth + 1} Subcategories`,
          pl: currentDepth === 0 ? 'Podkategorie' : `Kategorie Poziomu ${currentDepth + 1}`,
        },
      },
      label: {
        en: currentDepth === 0 ? 'Subcategories' : `Level ${currentDepth + 1} Subcategories`,
        pl: currentDepth === 0 ? 'Podkategorie' : `Kategorie Poziomu ${currentDepth + 1}`,
      },
      admin: {
        description: {
          en: 'Add subcategories to further organize services.',
          pl: 'Dodaj podkategorie, aby lepiej zorganizować usługi.',
        },
      },
      fields: createCategoryFields(maxDepth, currentDepth + 1),
    })
  }

  return fields
}

export const ServiceCategories: CollectionConfig = {
  slug: 'service-categories',
  labels: {
    singular: {
      en: 'Service Category',
      pl: 'Kategoria Usługi',
    },
    plural: {
      en: 'Service Categories',
      pl: 'Kategorie Usług',
    },
  },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: adminGroups.settings,
    defaultColumns: ['name', 'slug', 'requiredPlan'],
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
  },
  fields: createCategoryFields(2), // Set maxDepth to 2 for subcategories
}
