import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Base URL is optional, Better Auth will auto-detect it
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
})

export const { signIn, signUp, useSession, deleteUser } = authClient
