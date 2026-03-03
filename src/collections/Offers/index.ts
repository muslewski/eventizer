import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'

import { offersAccess } from './access'
import { offersFields } from './fields'
import {
  enforceMaxOffers,
  validateCategory,
  populateCategoryData,
  revalidateOffer,
  revalidateOfferOnDelete,
} from './hooks'

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
  // orderable: true,
  admin: {
    useAsTitle: 'title',
    group: adminGroups.featured,
    // Hide offers for clients
    hidden: ({ user }) => !isClientRoleEqualOrHigher('service-provider', user),
    defaultColumns: ['mainImage', 'title', '_status', 'category', 'user'],
    // hide api url in admin panel
    hideAPIURL: true,
    description: {
      en: `Manage and create service offers available to your clients.`,
      pl: `Zarządzaj i twórz oferty usług dostępne dla Twoich klientów.`,
    },
    // preview: (doc, { req }) => `${req.protocol}//${req.host}/ogloszenia/${doc.slug}`,
    // livePreview: {
    //   url: ({ req, data }) =>
    //     `${req.protocol}//${req.host}/${req.locale ? req.locale + '/' : ''}ogloszenia/${data?.link || ''}`,
    // },
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
    location: {
      address: true,
      city: true,
      lat: true,
      lng: true,
      serviceRadius: true,
    },
    video: true,
    meta: {
      image: true,
    },
  },

  access: offersAccess,

  hooks: {
    beforeOperation: [enforceMaxOffers],
    beforeValidate: [validateCategory],
    beforeChange: [populateCategoryData],
    afterChange: [revalidateOffer],
    afterDelete: [revalidateOfferOnDelete],
  },

  fields: offersFields,
}
