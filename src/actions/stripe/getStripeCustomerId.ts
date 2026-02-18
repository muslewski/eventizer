'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { stripe } from '@/lib/stripe'

/**
 * Get the Stripe customer ID for a given user ID.
 *
 * If multiple stripe-customers records exist for the same user (legacy bug),
 * this function checks which one actually has an active subscription in Stripe
 * and returns that customer ID. It also cleans up duplicates by deleting orphaned records.
 */
export async function getStripeCustomerId(userId: number): Promise<string | null> {
  const payload = await getPayload({ config })

  const customers = await payload.find({
    collection: 'stripe-customers',
    where: {
      user: { equals: userId },
    },
    limit: 10,
  })

  if (customers.docs.length === 0) return null

  // Fast path: single record (normal case after bug fix)
  if (customers.docs.length === 1) {
    return customers.docs[0]?.stripeID || null
  }

  // Multiple records found (legacy duplicates) — find the one with an active subscription
  payload.logger.warn(
    `Found ${customers.docs.length} stripe-customers records for user ${userId}, resolving duplicates...`,
  )

  let activeCustomerId: string | null = null

  for (const customer of customers.docs) {
    if (!customer.stripeID) continue

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.stripeID,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        activeCustomerId = customer.stripeID
        break
      }

      // Also check trialing
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customer.stripeID,
        status: 'trialing',
        limit: 1,
      })

      if (trialingSubscriptions.data.length > 0) {
        activeCustomerId = customer.stripeID
        break
      }
    } catch {
      // Skip this customer if Stripe lookup fails (may be deleted in Stripe)
    }
  }

  // Clean up duplicate records: keep only the active one, delete the rest
  if (activeCustomerId) {
    for (const customer of customers.docs) {
      if (customer.stripeID !== activeCustomerId) {
        try {
          await payload.delete({
            collection: 'stripe-customers',
            id: customer.id,
          })
          payload.logger.info(
            `Cleaned up duplicate stripe-customers record ${customer.id} (stripeID: ${customer.stripeID}) for user ${userId}`,
          )
        } catch {
          // Non-critical, log and continue
        }
      }
    }
    return activeCustomerId
  }

  // No active subscription found on any customer — return the first one
  return customers.docs[0]?.stripeID || null
}
