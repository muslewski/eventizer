'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { updateUserServiceCategory } from '@/actions/user/updateUserServiceCategory'

export interface ActivateBetaAccessResult {
  success: boolean
  error?: string
}

/**
 * Activates beta (free) service-provider access for a user.
 * Skips Stripe entirely – updates the user role and service category directly.
 */
export async function activateBetaAccess({
  userId,
  categoryNames,
  categorySlugs,
}: {
  userId: number
  categoryNames: string[]
  categorySlugs: string[]
}): Promise<ActivateBetaAccessResult> {
  try {
    // 1. Save the chosen service category
    const categoryResult = await updateUserServiceCategory({
      userId: String(userId),
      categoryNames,
      categorySlugs,
    })

    if (!categoryResult.success) {
      return { success: false, error: categoryResult.error || 'Nie udało się zapisać kategorii.' }
    }

    // 2. Promote the user to service-provider
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
      data: { role: 'service-provider', betaAccess: true },
    })

    payload.logger.info(`Beta access activated for user ${userId}`)

    return { success: true }
  } catch (error) {
    console.error('Error activating beta access:', error)
    return { success: false, error: 'Wystąpił błąd podczas aktywacji dostępu beta.' }
  }
}
