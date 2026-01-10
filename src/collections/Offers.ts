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
    slug: true,
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
      hooks: {
        beforeChange: [
          async ({ value, siblingData, req }) => {
            // Auto-populate category name from the category path
            if (siblingData?.category) {
              const { getOfferCategories } = await import('@/actions/getOfferCategories')
              const result = await getOfferCategories()
              const category = result.categories.find(
                (cat) => cat.fullPath === siblingData.category,
              )
              return category?.fullName || value
            }
            return value
          },
        ],
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'content',
              type: 'richText',
              label: {
                en: 'Content',
                pl: 'Treść',
              },
              required: true,
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
    slugField({ useAsSlug: 'title' }),
  ],
}
