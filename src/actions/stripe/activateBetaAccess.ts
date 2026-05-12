'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { updateUserServiceCategory } from '@/actions/user/updateUserServiceCategory'

export interface ActivateBetaAccessResult {
  success: boolean
  error?: string
}

/**
 * Activates beta (free) service-provider access for a user. Skips Stripe
 * entirely. The caller passes `maxOffers` from the chosen plan so beta users
 * on Multi/Agency get the correct cap (4 / 10) instead of the default 1.
 */
export async function activateBetaAccess({
  userId,
  categoryNames,
  categorySlugs,
  maxOffers,
}: {
  userId: number
  categoryNames: string[]
  categorySlugs: string[]
  maxOffers: number
}): Promise<ActivateBetaAccessResult> {
  try {
    // Save category only if the path is non-empty (Multi/Agency pass [])
    if (categoryNames.length > 0 && categorySlugs.length > 0) {
      const categoryResult = await updateUserServiceCategory({
        userId: String(userId),
        categoryNames,
        categorySlugs,
      })
      if (!categoryResult.success) {
        return { success: false, error: categoryResult.error || 'Nie udało się zapisać kategorii.' }
      }
    }

    const payload = await getPayload({ config })

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    if (!user) {
      return { success: false, error: 'Użytkownik nie został znaleziony.' }
    }

    if (user.role !== 'client' && user.role !== 'service-provider') {
      return {
        success: false,
        error: 'Tylko klienci lub usługodawcy mogą aktywować dostęp beta.',
      }
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        role: 'service-provider',
        betaAccess: true,
        maxOffers,
      },
    })

    payload.logger.info(`Beta access activated for user ${userId} (maxOffers=${maxOffers})`)

    return { success: true }
  } catch (error) {
    console.error('Error activating beta access:', error)
    return { success: false, error: 'Wystąpił błąd podczas aktywacji dostępu beta.' }
  }
}
