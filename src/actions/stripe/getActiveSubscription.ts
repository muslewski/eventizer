'use server'

import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

/**
 * Fetch active subscription from Stripe
 */
export async function getActiveSubscription(
  customerId: string,
): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    })

    // console.log('Active subscriptions found:', subscriptions.data.length)
    if (subscriptions.data.length > 0) {
      // console.log('First subscription:', JSON.stringify(subscriptions.data[0], null, 2))
      return subscriptions.data[0]
    }

    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'trialing',
      limit: 1,
    })

    // console.log('Trialing subscriptions found:', trialingSubscriptions.data.length)
    if (trialingSubscriptions.data[0]) {
      return trialingSubscriptions.data[0]
    }

    // Also check for past_due subscriptions (still technically active)
    const pastDueSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'past_due',
      limit: 1,
    })

    // console.log('Past due subscriptions found:', pastDueSubscriptions.data.length)
    return pastDueSubscriptions.data[0] || null
  } catch (error) {
    console.error('Error fetching subscription from Stripe:', error)
    return null
  }
}
