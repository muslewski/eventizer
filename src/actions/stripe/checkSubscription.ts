'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { timestampToISOString } from '@/lib/utils'

// Serializable subscription info (plain object, no methods)
export interface SerializedSubscription {
  id: string
  status: Stripe.Subscription.Status
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null // Add this field
  canceledAt: string | null
  priceId: string | null
  productId: string | null
}

// Serializable product info (plain object, no methods)
export interface SerializedProduct {
  id: string
  name: string
  description: string | null
  active: boolean
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscription: SerializedSubscription | null
  product: SerializedProduct | null
  plan: {
    id: string
    name: string
    slug?: string
  } | null
  status: Stripe.Subscription.Status | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null // Add this field
  isCancelling: boolean // Add computed field for easier checks
}

/**
 * Serialize Stripe subscription to plain object
 */
function serializeSubscription(subscription: Stripe.Subscription): SerializedSubscription {
  const item = subscription.items.data[0]
  const priceId = item?.price?.id || null
  const productId =
    typeof item?.price?.product === 'string' ? item.price.product : item?.price?.product?.id || null

  // Get period dates from subscription item (newer Stripe API)
  const currentPeriodStart = item?.current_period_start ?? subscription.current_period_start
  const currentPeriodEnd = item?.current_period_end ?? subscription.current_period_end

  return {
    id: subscription.id,
    status: subscription.status,
    currentPeriodStart: timestampToISOString(currentPeriodStart),
    currentPeriodEnd: timestampToISOString(currentPeriodEnd),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: timestampToISOString(subscription.cancel_at), // Add this
    canceledAt: timestampToISOString(subscription.canceled_at),
    priceId,
    productId,
  }
}

/**
 * Serialize Stripe product to plain object
 */
function serializeProduct(product: Stripe.Product): SerializedProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    active: product.active,
  }
}

/**
 * Fetch product from subscription item
 */
async function getProductFromSubscription(
  subscription: Stripe.Subscription,
): Promise<Stripe.Product | null> {
  const item = subscription.items.data[0]
  if (!item?.price?.product) return null

  const productId =
    typeof item.price.product === 'string' ? item.price.product : item.price.product.id

  try {
    const product = await stripe.products.retrieve(productId)
    return product
  } catch (error) {
    console.error('Error retrieving product from Stripe:', error)
    return null
  }
}

/**
 * Check subscription status for a given user ID
 */
export async function checkSubscription(userId: number): Promise<SubscriptionStatus> {
  const defaultResponse: SubscriptionStatus = {
    hasActiveSubscription: false,
    subscription: null,
    product: null,
    plan: null,
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    cancelAt: null,
    isCancelling: false,
  }

  try {
    // 1. Get Stripe customer id from our database
    const stripeCustomerId = await getStripeCustomerId(userId)
    if (!stripeCustomerId) return defaultResponse

    // 2. Fetch active subscription from Stripe
    const subscription = await getActiveSubscription(stripeCustomerId)
    if (!subscription) return defaultResponse

    // Get period end from subscription item (newer Stripe API)
    const item = subscription.items.data[0]
    const currentPeriodEnd = item?.current_period_end ?? subscription.current_period_end

    // 3. Extract product info
    const product = await getProductFromSubscription(subscription)

    // 4. Match with our plans if needed
    let plan: SubscriptionStatus['plan'] = null
    if (product) {
      const payload = await getPayload({ config })
      const plans = await payload.find({
        collection: 'subscription-plans',
        where: {
          stripeID: { equals: product.id },
        },
        limit: 1,
      })

      if (plans.docs[0]) {
        plan = {
          id: product.id,
          name: plans.docs[0].name,
          slug: plans.docs[0].slug,
        }
      } else {
        plan = {
          id: product.id,
          name: product.name,
        }
      }
    }

    // Serialize to plain objects
    const serializedSubscription = serializeSubscription(subscription)
    const serializedProduct = product ? serializeProduct(product) : null

    // Check if subscription is being cancelled (either via cancel_at_period_end OR cancel_at)
    const isCancelling = subscription.cancel_at_period_end || subscription.cancel_at !== null

    return {
      hasActiveSubscription: true,
      subscription: serializedSubscription,
      product: serializedProduct,
      plan,
      status: subscription.status,
      currentPeriodEnd: timestampToISOString(currentPeriodEnd),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: timestampToISOString(subscription.cancel_at),
      isCancelling,
    }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return defaultResponse
  }
}

/**
 * Check if user has access to a specific plan level
 */
export async function hasAccessToPlan(userId: number, requiredPlanSlug: string): Promise<boolean> {
  try {
    const payload = await getPayload({ config })
    const subscriptionStatus = await checkSubscription(userId)

    if (!subscriptionStatus.hasActiveSubscription || !subscriptionStatus.plan?.slug) {
      return false
    }

    const requiredPlan = await payload.find({
      collection: 'subscription-plans',
      where: {
        slug: { equals: requiredPlanSlug },
      },
      limit: 1,
    })

    if (!requiredPlan.docs[0]) {
      return false
    }

    const userPlan = await payload.find({
      collection: 'subscription-plans',
      where: {
        slug: { equals: subscriptionStatus.plan.slug },
      },
      limit: 1,
    })

    if (!userPlan.docs[0]) {
      return false
    }

    return userPlan.docs[0].level >= requiredPlan.docs[0].level
  } catch (error) {
    console.error('Error checking plan access:', error)
    return false
  }
}
