'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'

interface CreateCheckoutSessionParams {
  priceId: string
  userId: number
  successUrl: string
  cancelUrl: string
  categoryNames: string[]
  categorySlugs: string[]
  userEmail?: string
}

/**
 * Get or create a Stripe customer for the given user.
 * This ensures we always reuse the same Stripe customer for a user.
 */
async function getOrCreateStripeCustomer(userId: number, email: string): Promise<string> {
  const payload = await getPayload({ config })

  // 1. Check if customer already exists in our database (linked to user)
  const existingCustomers = await payload.find({
    collection: 'stripe-customers',
    where: {
      user: {
        equals: userId,
      },
    },
    limit: 1,
  })

  if (existingCustomers.docs[0]?.stripeID) {
    return existingCustomers.docs[0].stripeID
  }

  // 2. Check if customer exists in Stripe by email (might not be linked yet)
  const stripeCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (stripeCustomers.data[0]) {
    // Customer exists in Stripe - webhook will sync it to our DB
    return stripeCustomers.data[0].id
  }

  // 3. Create new customer in Stripe
  const newCustomer = await stripe.customers.create({
    email,
    metadata: {
      payloadUserId: userId.toString(),
    },
  })

  // The webhook will automatically create the record in our stripe-customers collection
  return newCustomer.id
}
/**
 * Start the payment
 * @returns { url: string } - The URL to redirect the user to for checkout
 */
export async function createCheckoutSession({
  priceId,
  userId,
  successUrl,
  cancelUrl,
  categoryNames,
  categorySlugs,
  userEmail,
}: CreateCheckoutSessionParams) {
  try {
    const headerList = await headers()
    const origin = headerList.get('origin') || process.env.NEXT_PUBLIC_BASE_URL

    // Get or create Stripe customer (prevents duplicate customers)
    const customerId = userEmail ? await getOrCreateStripeCustomer(userId, userEmail) : undefined

    // Create Stripe Checkout session with the user-selected price
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}${successUrl}`,
      cancel_url: `${origin}${cancelUrl}`,
      metadata: {
        userId,
        categoryNames: JSON.stringify(categoryNames),
        categorySlugs: JSON.stringify(categorySlugs),
      },
      // Use customer ID if available, otherwise fallback to email
      ...(customerId ? { customer: customerId } : { customer_email: userEmail }),
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)

    if (error instanceof Error) {
      throw new Error(`Failed to create checkout session: ${error.message}`)
    }

    throw new Error('Failed to create checkout session due to an unknown error')
  }
}
