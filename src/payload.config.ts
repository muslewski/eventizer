import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      views: {
        dashboard: {
          Component: '@/components/payload/customDashboard',
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
    // Marketplace
    Offers,

    // Auth
    Users,
    Sessions,
    Accounts,
    Verifications,

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
  editor: lexicalEditor(),
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
  ],
})
