// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/auth/Users'
import { Sessions } from './collections/auth/Sessions'
import { Accounts } from './collections/auth/Accounts'
import { Verifications } from './collections/auth/Verifications'

import { Media } from './collections/uploads/Media'
import { Offers } from '@/collections/Offers'
import { ProfilePictures } from '@/collections/uploads/ProfilePictures'
import { OfferUploads } from '@/collections/uploads/OfferUploads'
import { en } from '@payloadcms/translations/languages/en'
import { pl } from '@payloadcms/translations/languages/pl'
import { customTranslations } from '@/translations/custom-translations'

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
    // Auth
    Users,
    Sessions,
    Accounts,
    Verifications,

    // Uploads
    Media,
    ProfilePictures,
    OfferUploads,

    Offers,
  ],
  i18n: {
    fallbackLanguage: 'pl',
    supportedLanguages: { en, pl },
    translations: customTranslations,
  },
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
  plugins: [
    // storage-adapter-placeholder
  ],
})
