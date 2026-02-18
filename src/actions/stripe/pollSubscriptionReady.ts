'use server'

import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Server action polled by CheckoutSuccessHandler after Stripe redirect.
 * Returns true when the user's subscription is confirmed active and the
 * user role has been promoted to service-provider.
 *
 * This handles the race condition where the Stripe webhook may not have
 * been processed yet when the dashboard first renders after checkout.
 */
export async function pollSubscriptionReady(
  userId: number,
): Promise<{ ready: boolean; role?: string }> {
  try {
    const payload = await getPayload({ config })

    // Check user role
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    if (!user) return { ready: false }

    // Check subscription status
    const subscriptionDetails = await getCurrentSubscriptionDetails(userId)

    if (subscriptionDetails.hasSubscription && user.role === 'service-provider') {
      return { ready: true, role: user.role }
    }

    // Self-heal: if subscription is active but role is still client, promote now
    if (subscriptionDetails.hasSubscription && user.role === 'client') {
      await payload.update({
        collection: 'users',
        id: userId,
        data: { role: 'service-provider' },
      })
      payload.logger.info(
        `pollSubscriptionReady: Self-healed user ${userId} from client to service-provider`,
      )
      return { ready: true, role: 'service-provider' as string }
    }

    return { ready: false, role: user.role ?? undefined }
  } catch (error) {
    console.error('pollSubscriptionReady error:', error)
    return { ready: false }
  }
}
