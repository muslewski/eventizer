import { Plugin } from 'payload'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { getServerSideURL } from '@/utilities/getURL'
import { Page } from '@/payload-types'

const generateTitle: GenerateTitle<Page> = ({ doc }) => {
  return doc?.title ? `${doc.title}` : 'Eventizer'
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
    logs: true,
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
      // After successful Stripe Checkout, promote user from client to service-provider
      'checkout.session.completed': async ({ event, payload }) => {
        console.log('🪝 checkout.session.completed webhook received!')

        const session = event.data.object as {
          id: string
          metadata: Record<string, string> | null
          customer: string | null
          subscription: string | null
        }

        console.log('🪝 Session metadata:', JSON.stringify(session.metadata))

        const userId = session.metadata?.userId
        if (!userId) {
          console.log('checkout.session.completed: No userId in metadata, skipping role promotion')
          return
        }

        try {
          const numericUserId = Number(userId)

          // Parse category data from metadata
          const categoryNames = session.metadata?.categoryNames
            ? JSON.parse(session.metadata.categoryNames)
            : null
          const categorySlugs = session.metadata?.categorySlugs
            ? JSON.parse(session.metadata.categorySlugs)
            : null

          // Build update data
          const updateData: Record<string, unknown> = {
            role: 'service-provider',
          }

          // Set category info if available from metadata
          if (categoryNames && Array.isArray(categoryNames)) {
            updateData.serviceCategory = categoryNames.join(' > ')
          }
          if (categorySlugs && Array.isArray(categorySlugs)) {
            updateData.serviceCategorySlug = categorySlugs.join('/')
          }

          // Promote user to service-provider
          await payload.update({
            collection: 'users',
            id: numericUserId,
            data: updateData,
          })

          console.log(
            `checkout.session.completed: User ${numericUserId} promoted to service-provider`,
          )
        } catch (error) {
          console.error('Error promoting user after checkout:', error)
        }
      },

      // When a subscription is fully deleted (not just cancelled), revert user to client
      'customer.subscription.deleted': async ({ event, payload }) => {
        const subscription = event.data.object as {
          id: string
          customer: string
        }

        try {
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : (subscription.customer as any)?.id

          if (!customerId) {
            console.log('customer.subscription.deleted: No customer ID found, skipping')
            return
          }

          // Find the stripe-customer record to get the linked user
          const customers = await payload.find({
            collection: 'stripe-customers',
            where: {
              stripeID: { equals: customerId },
            },
            limit: 1,
          })

          const customer = customers.docs[0]
          const linkedUserId = customer?.user

          if (!linkedUserId) {
            console.log(
              `customer.subscription.deleted: No linked user for Stripe customer ${customerId}`,
            )
            return
          }

          const userId = typeof linkedUserId === 'object' ? linkedUserId.id : linkedUserId

          // Revert user to client and clear service category
          await payload.update({
            collection: 'users',
            id: userId,
            data: {
              role: 'client',
              serviceCategory: null,
              serviceCategorySlug: null,
            },
          })

          // Set all of this user's published offers to draft
          const userOffers = await payload.find({
            collection: 'offers',
            where: {
              user: { equals: userId },
              _status: { equals: 'published' },
            },
            limit: 0, // fetch all
            depth: 0,
          })

          if (userOffers.docs.length > 0) {
            await Promise.all(
              userOffers.docs.map((offer) =>
                payload.update({
                  collection: 'offers',
                  id: offer.id,
                  data: {
                    _status: 'draft',
                  },
                }),
              ),
            )
            console.log(
              `customer.subscription.deleted: Set ${userOffers.docs.length} offers to draft for user ${userId}`,
            )
          }

          console.log(
            `customer.subscription.deleted: User ${userId} reverted to client after subscription ${subscription.id} ended`,
          )
        } catch (error) {
          console.error('Error reverting user after subscription deletion:', error)
        }
      },

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
