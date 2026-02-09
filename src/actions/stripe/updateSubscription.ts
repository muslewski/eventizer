'use server'

import { stripe } from '@/lib/stripe'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface UpdateSubscriptionResult {
  success: boolean
  message: string
  action?: 'upgraded' | 'downgraded' | 'same_plan' | 'category_only'
  checkoutUrl?: string
}

/**
 * Update a subscription to a new plan.
 * Handles upgrade, downgrade, and same-plan category changes.
 */
export async function updateSubscription({
  userId,
  newProductId,
  newPriceId,
  categoryNames,
  categorySlugs,
}: {
  userId: number
  newProductId: string
  newPriceId?: string
  categoryNames: string[]
  categorySlugs: string[]
}): Promise<UpdateSubscriptionResult> {
  try {
    const payload = await getPayload({ config })

    // 1. Get the Stripe customer ID for the user
    const customerId = await getStripeCustomerId(userId)
    if (!customerId) {
      return {
        success: false,
        message: 'No Stripe customer ID found for user.',
      }
    }

    // 2. Retrieve the active subscription
    const subscription = await getActiveSubscription(customerId)
    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found.',
      }
    }

    // 3. Get current subscription item and product
    const subscriptionItem = subscription.items.data[0]
    if (!subscriptionItem) {
      return {
        success: false,
        message: 'No subscription item found.',
      }
    }

    const currentProductId =
      typeof subscriptionItem.price.product === 'string'
        ? subscriptionItem.price.product
        : subscriptionItem.price.product.id

    // 4. Check if it's the same product
    const currentPriceId = subscriptionItem.price.id
    if (currentProductId === newProductId) {
      // Check if user wants to change billing interval on the same plan
      if (newPriceId && newPriceId !== currentPriceId) {
        // Update subscription item to the new price (interval change)
        await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscriptionItem.id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
          metadata: {
            categoryNames: categoryNames.join(' > '),
            categorySlugs: categorySlugs.join('/'),
          },
        })

        // Update user's category
        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            serviceCategory: categoryNames.join(' > '),
            serviceCategorySlug: categorySlugs.join('/'),
          },
        })

        return {
          success: true,
          message: 'Okres rozliczeniowy i kategoria zostały zaktualizowane.',
          action: 'same_plan',
        }
      }

      // Just update the category, no subscription change needed
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          serviceCategory: categoryNames.join(' > '),
          serviceCategorySlug: categorySlugs.join('/'),
        },
      })

      return {
        success: true,
        message: 'Category updated successfully. No plan change needed.',
        action: 'category_only',
      }
    }

    // 5. Determine the price to use
    let selectedPriceId = newPriceId || null

    if (!selectedPriceId) {
      // No price explicitly selected — auto-pick from available prices
      const prices = await stripe.prices.list({
        product: newProductId,
        active: true,
        limit: 10,
      })

      if (prices.data.length === 0) {
        return {
          success: false,
          message: 'No active prices found for the selected plan.',
        }
      }

      // Prefer recurring, then default, then first available
      const recurringPrice = prices.data.find((price) => price.type === 'recurring')
      if (recurringPrice) {
        selectedPriceId = recurringPrice.id
      }

      if (!selectedPriceId) {
        const product = await stripe.products.retrieve(newProductId)
        if (product.default_price) {
          selectedPriceId =
            typeof product.default_price === 'string'
              ? product.default_price
              : product.default_price.id
        }
      }

      if (!selectedPriceId) {
        selectedPriceId = prices.data[0].id
      }
    }

    // 6. Get plan levels to determine upgrade/downgrade
    const [currentPlan, newPlan] = await Promise.all([
      payload.find({
        collection: 'subscription-plans',
        where: { stripeID: { equals: currentProductId } },
        limit: 1,
      }),
      payload.find({
        collection: 'subscription-plans',
        where: { stripeID: { equals: newProductId } },
        limit: 1,
      }),
    ])

    const currentLevel = currentPlan.docs[0]?.level ?? 0
    const newLevel = newPlan.docs[0]?.level ?? 0
    const isUpgrade = newLevel > currentLevel

    // 7. Update the subscription with the new price
    // For upgrades: prorate immediately
    // For downgrades: apply at end of billing period
    await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscriptionItem.id,
          price: selectedPriceId,
        },
      ],
      proration_behavior: isUpgrade ? 'create_prorations' : 'none',
      metadata: {
        categoryNames: categoryNames.join(' > '),
        categorySlugs: categorySlugs.join('/'),
      },
    })

    // 8. Update user's category in database
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        serviceCategory: categoryNames.join(' > '),
        serviceCategorySlug: categorySlugs.join('/'),
      },
    })

    return {
      success: true,
      message: isUpgrade
        ? 'Plan upgraded successfully. Prorated charges will be applied.'
        : 'Plan downgraded successfully. Changes will take effect at the end of your billing period.',
      action: isUpgrade ? 'upgraded' : 'downgraded',
    }
  } catch (error) {
    console.error('Error updating subscription:', error)
    return {
      success: false,
      message: 'An error occurred while updating the subscription.',
    }
  }
}
