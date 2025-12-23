'use server'

import Stripe from 'stripe'
import type { StripeProductDetails } from './getStripeProduct'
import type { StripePriceDetails } from './getStripePrices'
import { stripe } from '@/lib/stripe'

export interface StripeProductWithPrices {
  product: StripeProductDetails
  prices: StripePriceDetails[]
  defaultPrice: StripePriceDetails | null
}

export async function getStripeProductWithPrices(
  productId: string,
): Promise<{ success: true; data: StripeProductWithPrices } | { success: false; error: string }> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    // Fetch product and prices in parallel
    const [product, pricesResponse] = await Promise.all([
      stripe.products.retrieve(productId),
      stripe.prices.list({
        product: productId,
        expand: ['data.product'],
      }),
    ])

    const formattedProduct: StripeProductDetails = {
      id: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
      images: product.images,
      metadata: product.metadata,
      defaultPriceId:
        typeof product.default_price === 'string'
          ? product.default_price
          : (product.default_price?.id ?? null),
      created: new Date(product.created * 1000),
      updated: new Date(product.updated * 1000),
    }

    const formattedPrices: StripePriceDetails[] = pricesResponse.data.map((price) => ({
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

    const defaultPrice = formattedProduct.defaultPriceId
      ? (formattedPrices.find((p) => p.id === formattedProduct.defaultPriceId) ?? null)
      : null

    return {
      success: true,
      data: {
        product: formattedProduct,
        prices: formattedPrices,
        defaultPrice,
      },
    }
  } catch (error) {
    console.error('Error fetching Stripe product with prices:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch product details' }
  }
}
