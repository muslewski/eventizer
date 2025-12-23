'use server'

import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export interface StripePriceDetails {
  id: string
  active: boolean
  currency: string
  unitAmount: number | null
  unitAmountDecimal: string | null
  recurring: {
    interval: 'day' | 'week' | 'month' | 'year'
    intervalCount: number
    trialPeriodDays: number | null
    usageType: 'metered' | 'licensed'
  } | null
  type: 'one_time' | 'recurring'
  nickname: string | null
  metadata: Record<string, string>
  created: Date
}

export async function getStripePrices(
  productId: string,
): Promise<{ success: true; prices: StripePriceDetails[] } | { success: false; error: string }> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      expand: ['data.product'],
    })

    const formattedPrices: StripePriceDetails[] = prices.data.map((price) => ({
      id: price.id,
      active: price.active,
      currency: price.currency.toUpperCase(),
      unitAmount: price.unit_amount,
      unitAmountDecimal: price.unit_amount_decimal,
      recurring: price.recurring
        ? {
            interval: price.recurring.interval,
            intervalCount: price.recurring.interval_count,
            trialPeriodDays: price.recurring.trial_period_days,
            usageType: price.recurring.usage_type,
          }
        : null,
      type: price.type,
      nickname: price.nickname,
      metadata: price.metadata,
      created: new Date(price.created * 1000),
    }))

    return { success: true, prices: formattedPrices }
  } catch (error) {
    console.error('Error fetching Stripe prices:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch price details' }
  }
}
