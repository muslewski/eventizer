'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'

export interface RevertToClientResult {
  success: boolean
  error?: string
}

/**
 * Reverts a service-provider back to client role.
 * Only allowed if they don't have an active subscription.
 */
export async function revertToClient(userId: number): Promise<RevertToClientResult> {
  try {
    const payload = await getPayload({ config })

    // Verify the user exists and is currently a service-provider
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return {
        success: false,
        error: 'Użytkownik nie został znaleziony.',
      }
    }

    if (user.role !== 'service-provider') {
      return {
        success: false,
        error: 'Tylko usługodawcy mogą wrócić do roli klienta.',
      }
    }

    // Check if user has an active subscription
    const customerId = await getStripeCustomerId(userId)
    if (customerId) {
      const subscription = await getActiveSubscription(customerId)
      if (subscription) {
        return {
          success: false,
          error:
            'Nie można wrócić do roli klienta z aktywną subskrypcją. Najpierw anuluj subskrypcję.',
        }
      }
    }

    // Update the user's role back to client and clear service category
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        role: 'client',
        serviceCategory: null,
        serviceCategorySlug: null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error in revertToClient:', error)
    return {
      success: false,
      error: 'Wystąpił błąd podczas zmiany roli. Spróbuj ponownie.',
    }
  }
}
