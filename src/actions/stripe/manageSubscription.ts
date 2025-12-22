'use server'

import { stripe } from '@/lib/stripe'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { timestampToISOString } from '@/lib/utils'

export interface CancelSubscriptionResult {
  success: boolean
  message: string
  cancelAtPeriodEnd?: boolean
  canceledAt?: string | null
}

/**
 * Cancel a subscription at the end of the current billing period.
 * This is the safer option as the user keeps access until the period ends.
 */

export async function cancelSubscription(userId: number): Promise<CancelSubscriptionResult> {
  try {
    // 1. Get the Stripe customer ID for the user
    const customerId = await getStripeCustomerId(userId)
    if (!customerId) {
      return {
        success: false,
        message: 'No Stripe customer ID found for user.',
      }
    }

    // 2. Retrieve the active subscription for the customer
    const subscription = await getActiveSubscription(customerId)
    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found for customer.',
      }
    }

    // 3. Update the subscription to cancel at period end
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    // 4. return success result
    return {
      success: true,
      message: 'Subscription will be cancelled at the end of the current period.',
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      canceledAt: timestampToISOString(updatedSubscription.canceled_at),
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return {
      success: false,
      message: 'An error occurred while cancelling the subscription.',
    }
  }
}

export interface ReactivateSubscriptionResult {
  success: boolean
  message: string
}

/**
 * Reactivate a subscription that was set to cancel at period end.
 */
export async function reactivateSubscription(
  userId: number,
): Promise<ReactivateSubscriptionResult> {
  try {
    // 1. Get the Stripe customer ID for the user
    const customerId = await getStripeCustomerId(userId)
    if (!customerId) {
      return {
        success: false,
        message: 'No Stripe customer ID found for user.',
      }
    }

    // 2. Retrieve the active subscription for the customer
    const subscription = await getActiveSubscription(customerId)
    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found for customer.',
      }
    }

    // 3. Update the subscription to reactivate it
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
    })

    // 4. return success result
    return {
      success: true,
      message: 'Subscription has been reactivated.',
    }
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return {
      success: false,
      message: 'An error occurred while reactivating the subscription.',
    }
  }
}

export interface CreateBillingPortalResult {
  success: boolean
  url?: string
  message?: string
}

/**
 * Create a Stripe Billing Portal session for the user to manage their subscription
 * This allows users to update payment methods, view invoices, etc.
 */
export async function createBillingPortalSession(
  userId: number,
  returnUrl: string,
): Promise<CreateBillingPortalResult> {
  try {
    // 1. Get the Stripe customer ID for the user
    const customerId = await getStripeCustomerId(userId)
    if (!customerId) {
      return {
        success: false,
        message: 'No Stripe customer ID found for user.',
      }
    }

    // 2. Create the billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    // 3. Return the session URL
    return {
      success: true,
      url: session.url || undefined,
    }
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return {
      success: false,
      message: 'An error occurred while creating the billing portal session.',
    }
  }
}
