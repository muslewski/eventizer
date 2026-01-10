import { Plugin } from 'payload'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { getServerSideURL } from '@/utilities/getURL'
import { Page } from '@/payload-types'

const generateTitle: GenerateTitle<Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Eventizer` : 'Eventizer'
}

const generateURL: GenerateURL<Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  vercelBlobStorage({
    collections: {
      media: {
        prefix: 'Media',
      },
      'profile-pictures': {
        prefix: 'Profile Pictures',
      },
      'offer-uploads': {
        prefix: 'Offer Uploads',
      },
    },
    token: process.env.BLOB_READ_WRITE_TOKEN || '',
  }),
  seoPlugin({ generateTitle, generateURL }),
  stripePlugin({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET || '',
    sync: [
      {
        collection: 'subscription-plans',
        stripeResourceType: 'products',
        stripeResourceTypeSingular: 'product',
        fields: [
          {
            fieldPath: 'name',
            stripeProperty: 'name',
          },
          {
            fieldPath: 'description',
            stripeProperty: 'description',
          },
        ],
      },
      {
        collection: 'stripe-customers',
        stripeResourceType: 'customers',
        stripeResourceTypeSingular: 'customer',
        fields: [
          {
            fieldPath: 'email',
            stripeProperty: 'email',
          },
          {
            fieldPath: 'name',
            stripeProperty: 'name',
          },
          {
            fieldPath: 'business_name',
            stripeProperty: 'business_name',
          },
          {
            fieldPath: 'phone',
            stripeProperty: 'phone',
          },
          {
            fieldPath: 'metadata',
            stripeProperty: 'metadata',
          },
        ],
      },
    ],
    webhooks: {
      // Hey so sometimes we have already created customer in stripe yet we don't have him in payload, so then we should make sure to at least truck him by subscription. Or not.
      // 'customer.subscription.created': async ({ event, payload }) => {
      //   const subscription = event.data.object as { id: string; customer: string }
      // },
      'customer.deleted': async ({ event, payload }) => {
        const customer = event.data.object as { id: string }

        try {
          // First check if the customer exists in our database
          const existingCustomer = await payload.db.findOne({
            collection: 'stripe-customers',
            where: {
              stripeID: {
                equals: customer.id,
              },
            },
          })

          if (!existingCustomer) {
            console.log('Stripe Customer already deleted from Payload:', customer.id)
            return
          }

          // Use db adapter directly to bypass all hooks
          const result = await payload.db.deleteOne({
            collection: 'stripe-customers',
            where: {
              stripeID: {
                equals: customer.id,
              },
            },
          })

          console.log('Successfully deleted Stripe Customer from Payload:', customer.id, result)
        } catch (error) {
          console.error('Error deleting Stripe Customer from Payload:', error)
        }
      },
    },
  }),
]
