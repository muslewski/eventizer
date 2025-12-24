'use server'

import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SubscriptionPlan } from '@/payload-types'

export interface CurrentSubscriptionDetails {
  hasSubscription: boolean
  currentProductId?: string
  currentPlan?: SubscriptionPlan
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
}

export async function getCurrentSubscriptionDetails(
  userId: number,
): Promise<CurrentSubscriptionDetails> {
  try {
    const customerId = await getStripeCustomerId(userId)
    if (!customerId) {
      return { hasSubscription: false }
    }

    const subscription = await getActiveSubscription(customerId)
    if (!subscription) {
      return { hasSubscription: false }
    }

    const subscriptionItem = subscription.items.data[0]
    if (!subscriptionItem) {
      return { hasSubscription: false }
    }

    const currentProductId =
      typeof subscriptionItem.price.product === 'string'
        ? subscriptionItem.price.product
        : subscriptionItem.price.product.id

    // Get the plan from Payload
    const payload = await getPayload({ config })
    const plans = await payload.find({
      collection: 'subscription-plans',
      where: { stripeID: { equals: currentProductId } },
      limit: 1,
    })

    // Safely convert timestamp to ISO string
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : undefined

    return {
      hasSubscription: true,
      currentProductId,
      currentPlan: plans.docs[0] || undefined,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  } catch (error) {
    console.error('Error getting current subscription details:', error)
    return { hasSubscription: false }
  }
}
