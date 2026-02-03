import { adminOrHigherOrSelf, moderatorOrHigherOrSelf, providerOrHigher } from '@/access'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { redirect } from 'next/navigation'
import { APIError, slugField, type CollectionConfig } from 'payload'

const MAX_OFFERS_PER_USER = 10

// Polish voivodeships with slugs for search params
export const POLISH_PROVINCES = [
  { label: { en: 'Lower Silesian', pl: 'Dolnośląskie' }, value: 'dolnoslaskie' },
  { label: { en: 'Kuyavian-Pomeranian', pl: 'Kujawsko-Pomorskie' }, value: 'kujawsko-pomorskie' },
  { label: { en: 'Lublin', pl: 'Lubelskie' }, value: 'lubelskie' },
  { label: { en: 'Lubusz', pl: 'Lubuskie' }, value: 'lubuskie' },
  { label: { en: 'Łódź', pl: 'Łódzkie' }, value: 'lodzkie' },
  { label: { en: 'Lesser Poland', pl: 'Małopolskie' }, value: 'malopolskie' },
  { label: { en: 'Masovian', pl: 'Mazowieckie' }, value: 'mazowieckie' },
  { label: { en: 'Opole', pl: 'Opolskie' }, value: 'opolskie' },
  { label: { en: 'Subcarpathian', pl: 'Podkarpackie' }, value: 'podkarpackie' },
  { label: { en: 'Podlaskie', pl: 'Podlaskie' }, value: 'podlaskie' },
  { label: { en: 'Pomeranian', pl: 'Pomorskie' }, value: 'pomorskie' },
  { label: { en: 'Silesian', pl: 'Śląskie' }, value: 'slaskie' },
  { label: { en: 'Holy Cross', pl: 'Świętokrzyskie' }, value: 'swietokrzyskie' },
  { label: { en: 'Warmian-Masurian', pl: 'Warmińsko-Mazurskie' }, value: 'warminsko-mazurskie' },
  { label: { en: 'Greater Poland', pl: 'Wielkopolskie' }, value: 'wielkopolskie' },
  { label: { en: 'West Pomeranian', pl: 'Zachodniopomorskie' }, value: 'zachodniopomorskie' },
]

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: {
    singular: {
      en: 'Offer',
      pl: 'Oferta',
    },
    plural: {
      en: 'Offers',
      pl: 'Oferty',
    },
  },
  orderable: true,
  admin: {
    useAsTitle: 'title',
    group: adminGroups.featured,
    // Hide offers for clients
    hidden: ({ user }) => !isClientRoleEqualOrHigher('service-provider', user),
    defaultColumns: ['title', '_status', 'category', 'user'],
    // hide api url in admin panel
    hideAPIURL: true,
    description: {
      en: `Manage and create service offers available to your clients. (limit ${MAX_OFFERS_PER_USER} offers)`,
      pl: `Zarządzaj i twórz oferty usług dostępne dla Twoich klientów. (limit ${MAX_OFFERS_PER_USER} ofert)`,
    },
  },

  versions: {
    drafts: {
      autosave: true,

      // schedulePublish: true,
    },
  },

  defaultPopulate: {
    title: true,
    _status: true,
    slug: true,
    mainImage: true,
    categoryName: true,
    categorySlug: true,
    shortDescription: true,
    priceFrom: true,
    priceTo: true,
    price: true,
    hasPriceRange: true,
    serviceArea: true,
    meta: {
      image: true,
    },
  },

  access: {
    // admin see everything
    create: providerOrHigher, // providers and highers can create
    read: ({ req: { user } }) => {
      // If no user, allow public read (for viewing images)
      if (!user) return true

      // Moderators and above can see all
      if (isClientRoleEqualOrHigher('moderator', user)) return true

      // Regular users only see their own offers
      return {
        user: {
          equals: user.id,
        },
      }
    },
    update: moderatorOrHigherOrSelf('user'), // mods, admins, and owners
    delete: adminOrHigherOrSelf('user'), // only admins or owners of document
  },

  hooks: {
    beforeOperation: [
      async ({ operation, req }) => {
        // Enforce max offers per user
        if (
          operation === 'create' &&
          req.user &&
          !isClientRoleEqualOrHigher('moderator', req.user)
        ) {
          const existingOffers = await req.payload.find({
            collection: 'offers',
            where: {
              user: {
                equals: req.user.id,
              },
            },
            limit: 0, // we only need the count
          })

          if (existingOffers.totalDocs >= MAX_OFFERS_PER_USER) {
            redirect('/app/offers-limit-reached')
          }
        }
      },
    ],
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data?.category || !req.user) return data

        // Skip validation for admins/moderators
        if (isClientRoleEqualOrHigher('moderator', req.user)) {
          return data
        }

        // Validate category access for create/update
        if (operation === 'create' || operation === 'update') {
          const { validateOfferCategory } = await import('@/actions/getOfferCategories')
          const validation = await validateOfferCategory(data.category)

          if (!validation.valid) {
            throw new Error(validation.error || 'Invalid category selection')
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        // Auto-populate categoryName and categorySlug from the category path
        if (data?.category) {
          const { getOfferCategories } = await import('@/actions/getOfferCategories')
          const result = await getOfferCategories()
          const category = result.categories.find((cat) => cat.fullPath === data.category)

          if (category) {
            data.categoryName = category.fullName
            data.categorySlug = category.fullPath
          }
        }
        return data
      },
    ],
  },

  fields: [
    // Admin fields
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: {
        en: 'User',
        pl: 'Użytkownik',
      },
      access: {
        read: fieldRoleOrHigher('moderator'),
        update: fieldRoleOrHigher('admin'),
      },
      defaultValue: ({ req }) => req.user?.id,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: () => {
        const now = new Date()
        const day = now.getDate().toString().padStart(2, '0')
        const month = (now.getMonth() + 1).toString().padStart(2, '0')
        const hour = now.getHours().toString().padStart(2, '0')
        const minute = now.getMinutes().toString().padStart(2, '0')
        const seconds = now.getSeconds().toString().padStart(2, '0')
        return `Nowa oferta ${day}.${month} ${hour}:${minute}:${seconds}`
      },
      // localized: true,
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
    },
    {
      name: 'category',
      type: 'text',
      required: true,
      label: {
        en: 'Category',
        pl: 'Kategoria',
      },
      admin: {
        components: {
          Field: '/components/payload/fields/offerCategorySelect',
        },
        description: {
          en: 'Select the category for this offer based on your subscription plan.',
          pl: 'Wybierz kategorię dla tej oferty na podstawie Twojego planu subskrypcji.',
        },
      },
    },

    {
      type: 'checkbox',
      name: 'hasPriceRange',
      label: {
        en: 'Has Price Range',
        pl: 'Posiada Zakres Cenowy',
      },
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Check if this offer has a price range instead of a fixed price.',
          pl: 'Zaznacz, jeśli ta oferta posiada zakres cenowy zamiast stałej ceny.',
        },
      },
    },
    {
      type: 'number',
      name: 'price',
      label: {
        en: 'Price (PLN)',
        pl: 'Cena (PLN)',
      },
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
        condition: (data, siblingData) => !siblingData?.hasPriceRange,
        description: {
          en: 'Set the price for this offer in Polish Zloty (PLN).',
          pl: 'Ustaw cenę tej oferty w polskich złotych (PLN).',
        },
      },
    },
    {
      type: 'number',
      name: 'priceFrom',
      label: {
        en: 'Price From (PLN)',
        pl: 'Cena Od (PLN)',
      },
      min: 0,
      admin: {
        position: 'sidebar',
        condition: (data, siblingData) => Boolean(siblingData?.hasPriceRange),
      },
    },
    {
      type: 'number',
      name: 'priceTo',
      label: {
        en: 'Price To (PLN)',
        pl: 'Cena Do (PLN)',
      },
      min: 0,
      admin: {
        position: 'sidebar',
        condition: (data, siblingData) => Boolean(siblingData?.hasPriceRange),
      },
    },
    {
      name: 'mainImage',
      type: 'upload',
      relationTo: 'offer-uploads',
      required: true,
      label: {
        en: 'Main Image',
        pl: 'Główne Zdjęcie',
      },
      admin: {
        description: {
          en: 'Upload the main image representing your offer.',
          pl: 'Prześlij główne zdjęcie reprezentujące Twoją ofertę.',
        },
      },
    },
    // Display-friendly category name (auto-populated)
    {
      name: 'categoryName',
      type: 'text',
      label: {
        en: 'Category Name',
        pl: 'Nazwa Kategorii',
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data, siblingData, { user }) => {
          return isClientRoleEqualOrHigher('moderator', user)
        },
      },
      // hooks: {
      //   beforeChange: [
      //     async ({ value, siblingData, req }) => {
      //       // Auto-populate category name from the category path
      //       if (siblingData?.category) {
      //         const { getOfferCategories } = await import('@/actions/getOfferCategories')
      //         const result = await getOfferCategories()
      //         const category = result.categories.find(
      //           (cat) => cat.fullPath === siblingData.category,
      //         )
      //         return category?.fullName || value
      //       }
      //       return value
      //     },
      //   ],
      // },
    },
    // Category slug (auto-populated from category path)
    {
      name: 'categorySlug',
      type: 'text',
      label: {
        en: 'Category Slug',
        pl: 'Slug Kategorii',
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data, siblingData, { user }) => {
          return isClientRoleEqualOrHigher('moderator', user)
        },
      },
      // hooks: {
      //   beforeChange: [
      //     async ({ value, siblingData, req }) => {
      //       // Auto-populate category slug from the category path
      //       if (siblingData?.category) {
      //         const { getOfferCategories } = await import('@/actions/getOfferCategories')
      //         const result = await getOfferCategories()
      //         const category = result.categories.find(
      //           (cat) => cat.fullPath === siblingData.category,
      //         )
      //         return category?.slug || value
      //       }
      //       return value
      //     },
      //   ],
      // },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            // Add instruction - instrukcja przejrzystej oferty
            {
              name: 'content',
              type: 'richText',
              label: {
                en: 'Content',
                pl: 'Treść',
              },
              required: true,
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: {
                en: 'Short Description',
                pl: 'Krótki Opis',
              },
              admin: {
                description: {
                  en: 'A brief summary of the offer, shown in listings.',
                  pl: 'Krótki opis oferty, wyświetlany na listach.',
                },
              },
              required: true,
            },
            {
              name: 'phone',
              type: 'text',
              label: {
                en: 'Phone Number',
                pl: 'Numer Telefonu',
              },
              admin: {
                description: {
                  en: 'Phone number related to the offer.',
                  pl: 'Numer telefonu związany z ofertą.',
                },
              },
            },
            {
              name: 'email',
              type: 'text',
              label: {
                en: 'Email',
                pl: 'Email',
              },
              admin: {
                description: {
                  en: 'Email address related to the offer.',
                  pl: 'Adres email związany z ofertą.',
                },
              },
            },

            {
              name: 'serviceArea',
              type: 'select',
              hasMany: true,
              required: true,
              label: {
                en: 'Service Area',
                pl: 'Województwo',
              },
              options: POLISH_PROVINCES,
              admin: {
                description: {
                  en: 'Select the province where this offer is available.',
                  pl: 'Wybierz województwo, w którym ta oferta jest dostępna.',
                },
              },
              index: true, // Index for faster search queries
            },
            // Here we should have checkbox to disable address and serviceArea, it should be question like isWithoutAddress
            {
              name: 'isWithoutAddress',
              type: 'checkbox',
              label: {
                en: 'Offer without address',
                pl: 'Oferta bez adresu',
              },
              defaultValue: false,
              admin: {
                description: {
                  en: 'Check if this offer does not have a specific address.',
                  pl: 'Zaznacz, jeśli ta oferta nie posiada konkretnego adresu.',
                },
              },
            },
            {
              name: 'address',
              type: 'text',
              label: {
                en: 'Address',
                pl: 'Adres',
              },
              admin: {
                description: {
                  en: 'Optional address related to the offer.',
                  pl: 'Opcjonalny adres związany z ofertą.',
                },
                condition: (data) => !data?.isWithoutAddress,
              },
              required: false,
            },
          ],
          label: {
            en: 'Content',
            pl: 'Treść',
          },
        },

        {
          name: 'meta',
          label: {
            pl: 'Pozycjonowanie w wyszukiwarkach',
            en: 'Search Engine Optimization',
          },
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
              overrides: {
                localized: false,
              },
            }),
            MetaImageField({
              relationTo: 'offer-uploads',
              overrides: {
                localized: false,
              },
            }),

            MetaDescriptionField({
              overrides: {
                localized: false,
              },
            }),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    slugField({
      useAsSlug: 'title',
    }),
  ],
}
