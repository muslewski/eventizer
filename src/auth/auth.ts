import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as schema from '@/payload-generated-schema'
import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sendVerificationEmail } from '@/auth/email/sendEmail'

// Create a direct drizzle connection for Better Auth
const db = drizzle(sql)

if (!process.env.GOOGLE_PROVIDER_CLIENT_ID || !process.env.GOOGLE_PROVIDER_CLIENT_SECRET) {
  throw new Error('Google OAuth credentials are not set in environment variables.')
}

if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
  throw new Error('Facebook OAuth credentials are not set in environment variables.')
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
  advanced: {
    generatedId: false,
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true, // Added missing comma here
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log('SEND VERIFICATION EMAIL')

      void sendVerificationEmail(user, url)
    },
  },

  user: {
    modelName: 'users',
    deleteUser: {
      enabled: true,
    },
  },
  account: {
    modelName: 'user_accounts',
    accountLinking: {
      allowDifferentEmails: true,
      enabled: true,
    },
  },
  verification: {
    modelName: 'user_verifications',
  },
  session: {
    modelName: 'user_sessions',
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_PROVIDER_CLIENT_ID,
      clientSecret: process.env.GOOGLE_PROVIDER_CLIENT_SECRET,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    },
  },
})
