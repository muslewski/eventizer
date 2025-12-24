'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export interface BecomeServiceProviderResult {
  success: boolean
  error?: string
}

/**
 * Changes a client's role to service-provider.
 * This initiates the onboarding process.
 */
export async function becomeServiceProvider(userId: number): Promise<BecomeServiceProviderResult> {
  try {
    const payload = await getPayload({ config })

    // Verify the user exists and is currently a client
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

    if (user.role !== 'client') {
      return {
        success: false,
        error: 'Tylko klienci mogą przejść przez proces zostania usługodawcą.',
      }
    }

    // Update the user's role to service-provider
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        role: 'service-provider',
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error in becomeServiceProvider:', error)
    return {
      success: false,
      error: 'Wystąpił błąd podczas zmiany roli. Spróbuj ponownie.',
    }
  }
}
