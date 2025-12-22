'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Get the customer ID for a given user ID
 */
export async function getStripeCustomerId(userId: number): Promise<string | null> {
  const payload = await getPayload({ config })

  const customers = await payload.find({
    collection: 'stripe-customers',
    where: {
      user: { equals: userId },
    },
    limit: 1,
  })

  const customer = customers.docs[0]
  return customer?.stripeID || null
}
