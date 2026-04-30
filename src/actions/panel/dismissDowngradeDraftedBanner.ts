'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function dismissDowngradeDraftedBanner() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return { success: false as const, error: 'Brak autoryzacji' }
    }
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'users',
      id: Number(session.user.id),
      data: { downgradedDraftedAt: null },
      overrideAccess: true,
    })
    revalidatePath('/pl/panel/dashboard')
    revalidatePath('/en/panel/dashboard')
    return { success: true as const }
  } catch (err) {
    console.error('[dismissDowngradeDraftedBanner]', err)
    return { success: false as const, error: 'Nie udało się ukryć powiadomienia' }
  }
}
