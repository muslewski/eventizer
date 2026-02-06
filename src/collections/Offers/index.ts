import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'

import { offersAccess } from './access'
import { offersFields } from './fields'
import { enforceMaxOffers, validateCategory, populateCategoryData } from './hooks'
import { MAX_OFFERS_PER_USER } from './hooks/enforceMaxOffers'

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
    // preview: (doc, { req }) => `${req.protocol}//${req.host}/ogloszenia/${doc.slug}`,
    livePreview: {
      url: ({ req, data }) =>
        `${req.protocol}//${req.host}/${req.locale ? req.locale + '/' : ''}ogloszenia/${data?.link || ''}`,
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
    link: true,
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

  access: offersAccess,

  hooks: {
    beforeOperation: [enforceMaxOffers],
    beforeValidate: [validateCategory],
    beforeChange: [populateCategoryData],
  },

  fields: offersFields,
}
