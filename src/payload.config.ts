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

import { Media } from './collections/Media'
import { Offers } from '@/collections/Offers'

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

    Media,
    Offers,
  ],
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
