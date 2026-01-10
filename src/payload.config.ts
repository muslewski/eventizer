import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { resendAdapter } from '@payloadcms/email-resend'

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
import { plugins } from '@/plugins'

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
        'offers-limit-reached': {
          Component: '@/components/payload/views/offersLimitReached',
          path: '/offers-limit-reached',
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
      login: '/redirect-to-sign-in',
      createFirstUser: '/redirect-to-sign-in',
      forgot: '/redirect-to-sign-in',
      reset: '/redirect-to-sign-in',
      logout: '/sign-out',
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
  localization: {
    locales: [
      {
        label: {
          pl: 'Polski',
          en: 'Polish',
        },
        code: 'pl',
      },
      {
        label: {
          pl: 'Angielski',
          en: 'English',
        },
        code: 'en',
      },
    ],
    defaultLocale: 'pl',
  },
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
  plugins,
})
