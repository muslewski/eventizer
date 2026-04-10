'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function updateAccount(data: { name?: string }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: 'users',
      id: Number(session.user.id),
      data,
      overrideAccess: true,
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[updateAccount]', err)
    return { success: false as const, error: 'Nie udało się zaktualizować konta' }
  }
}
