'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Check if a user has a stripe-customers record (was previously a paying customer).
 * This is useful for detecting returning customers whose subscription expired
 * but who still have a Stripe customer profile.
 */
export async function isReturningCustomer(userId: number): Promise<boolean> {
  const payload = await getPayload({ config })

  const customers = await payload.find({
    collection: 'stripe-customers',
    where: {
      user: { equals: userId },
    },
    limit: 1,
    depth: 0,
  })

  return customers.docs.length > 0
}
