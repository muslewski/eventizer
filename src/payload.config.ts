import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import { seoPlugin } from '@payloadcms/plugin-seo'

// Collections
import { Users } from './collections/auth/Users'
import { Sessions } from './collections/auth/Sessions'
import { Accounts } from './collections/auth/Accounts'
import { Verifications } from './collections/auth/Verifications'
import { Media } from './collections/uploads/Media'
import { Offers } from '@/collections/Offers'
import { ProfilePictures } from '@/collections/uploads/ProfilePictures'
import { OfferUploads } from '@/collections/uploads/OfferUploads'

// i18n
import { en } from '@payloadcms/translations/languages/en'
import { pl } from '@payloadcms/translations/languages/pl'
import { customTranslations } from '@/translations/custom-translations'
import { HelpTickets } from '@/collections/HelpTickets'
import { SubscriptionPlans } from '@/collections/SubscriptionPlans'
import { ServiceCategories } from '@/collections/ServiceCategories'
import { StripeCustomers } from '@/collections/Customers'
import { defaultLexical } from '@/fields/defaultLexical'
import { Pages } from '@/collections/Pages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  routes: {
    admin: '/app',
  },
  admin: {
    meta: {
      icons: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          fetchPriority: 'high',
          url: '/my-favicon/favicon.ico',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          fetchPriority: 'high',
          url: '/my-favicon/icon0.svg',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          fetchPriority: 'high',
          url: '/my-favicon/icon1.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          fetchPriority: 'high',
          url: '/my-favicon/apple-icon.png',
        },
        {
          rel: 'manifest',
          fetchPriority: 'high',
          url: '/my-favicon/manifest.json',
        },
      ],
      titleSuffix: ' - Eventizer App',
      description:
        'Eventizer - łączymy dostawców usług z klientami szukającymi niezapomnianych doświadczeń.',
    },

    components: {
      // header: ['@/components/payload/customHeader'],
      views: {
        'onboarding-service-provider': {
          Component: '@/components/payload/views/serviceProviderOnboarding',
          path: '/onboarding/service-provider',
        },
        dashboard: {
          Component: '@/components/payload/views/customDashboard',
        },
      },
      beforeNavLinks: ['@/components/payload/beforeNav'],
      graphics: {
        Logo: '@/components/payload/customLogo',
        Icon: '@/components/payload/customIcon',
      },
      Nav: '@/components/payload/customNav',
    },
    avatar: {
      Component: '@/components/payload/customAvatar',
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    routes: {
      login: '/auth/sign-in',
      createFirstUser: '/auth/sign-up',
      forgot: '/auth/forgot-password',
      reset: '/auth/reset-password',
      logout: '/auth/sign-out',
    },
  },

  collections: [
    // Website
    Pages,

    // Marketplace
    Offers,

    // Auth
    Users,
    Sessions,
    Accounts,
    Verifications,

    // Settings
    ServiceCategories,
    SubscriptionPlans,
    StripeCustomers,

    // Uploads
    Media,
    ProfilePictures,
    OfferUploads,

    // Help
    HelpTickets,
  ],
  i18n: {
    fallbackLanguage: 'pl',
    supportedLanguages: { en, pl },
    translations: customTranslations,
  },
  // localization: {
  //   locales: [
  //     {
  //       label: {
  //         pl: 'Polski',
  //         en: 'Polish',
  //       },
  //       code: 'pl',
  //     },
  //     {
  //       label: {
  //         pl: 'Angielski',
  //         en: 'English',
  //       },
  //       code: 'en',
  //     },
  //   ],
  //   defaultLocale: 'pl',
  // },
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || '',
    defaultFromName: process.env.EMAIL_FROM_NAME || '',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  editor: defaultLexical,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  sharp,
  upload: {
    abortOnLimit: true,
    responseOnLimit: 'File size exceeds the maximum limit of 5MB.',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB in bytes
    },
  },
  plugins: [
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
    seoPlugin({ collections: ['pages'] }),
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
  ],
})
