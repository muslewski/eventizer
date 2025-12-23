'use server'

import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export interface StripeProductDetails {
  id: string
  name: string
  description: string | null
  active: boolean
  images: string[]
  metadata: Record<string, string>
  defaultPriceId: string | null
  created: Date
  updated: Date
}

export async function getStripeProduct(
  productId: string,
): Promise<{ success: true; product: StripeProductDetails } | { success: false; error: string }> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    const product = await stripe.products.retrieve(productId)

    return {
      success: true,
      product: {
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
      },
    }
  } catch (error) {
    console.error('Error fetching Stripe product:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch product details' }
  }
}
