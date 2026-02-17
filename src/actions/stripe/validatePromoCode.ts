'use server'

import { stripe } from '@/lib/stripe'

export interface ValidatePromoCodeResult {
  valid: boolean
  promotionCodeId?: string
  couponName?: string
  percentOff?: number | null
  amountOff?: number | null
  currency?: string | null
  error?: string
}

/**
 * Validate a promotion code string against Stripe.
 * Returns the promotion code ID if valid, which can be passed to checkout session.
 *
 * Optionally checks if the coupon is applicable to a specific price.
 */
export async function validatePromoCode(
  code: string,
  priceId?: string,
): Promise<ValidatePromoCodeResult> {
  if (!code.trim()) {
    return { valid: false, error: 'Wprowadź kod promocyjny.' }
  }

  try {
    // Search for active promotion codes matching this code
    // Try exact input first, then uppercase (Stripe code search is case-sensitive)
    let promotionCodes = await stripe.promotionCodes.list({
      code: code.trim(),
      active: true,
      limit: 1,
      expand: ['data.coupon'],
    })

    if (promotionCodes.data.length === 0 && code.trim() !== code.trim().toUpperCase()) {
      promotionCodes = await stripe.promotionCodes.list({
        code: code.trim().toUpperCase(),
        active: true,
        limit: 1,
        expand: ['data.coupon'],
      })
    }

    if (promotionCodes.data.length === 0) {
      return { valid: false, error: 'Nieprawidłowy lub nieaktywny kod promocyjny.' }
    }

    const promoCode = promotionCodes.data[0]
    if (!promoCode) {
      return { valid: false, error: 'Nieprawidłowy lub nieaktywny kod promocyjny.' }
    }

    // Stripe API may return coupon at promoCode.coupon (expanded object)
    // or at promoCode.promotion.coupon (string ID in newer API versions)
    let coupon: any = promoCode.coupon
    if (!coupon && (promoCode as any).promotion?.coupon) {
      const couponId = (promoCode as any).promotion.coupon
      coupon = typeof couponId === 'string'
        ? await stripe.coupons.retrieve(couponId)
        : couponId
    }
    if (typeof coupon === 'string') {
      coupon = await stripe.coupons.retrieve(coupon)
    }

    if (!coupon || typeof coupon !== 'object') {
      return { valid: false, error: 'Nie udało się pobrać informacji o kuponie.' }
    }

    // Note: We don't check coupon.valid here because Stripe's promotion code
    // `active: true` filter already ensures the promo code is usable.
    // coupon.valid can be false for coupons with max_redemptions reached,
    // but Stripe Checkout still accepts active promotion codes.

    // If priceId provided, check interval restriction (no yearly plans)
    if (priceId) {
      const price = await stripe.prices.retrieve(priceId)
      const isYearly =
        price.recurring?.interval === 'year' ||
        (price.recurring?.interval === 'month' && (price.recurring?.interval_count ?? 0) >= 12)

      if (isYearly) {
        return { valid: false, error: 'Kody promocyjne nie obowiązują dla planów rocznych.' }
      }

      // Check if the coupon restricts to specific products
      if (coupon.applies_to?.products && coupon.applies_to.products.length > 0) {
        const productId = typeof price.product === 'string' ? price.product : price.product.id

        if (!coupon.applies_to.products.includes(productId)) {
          return { valid: false, error: 'Ten kod nie dotyczy wybranego planu.' }
        }
      }
    }

    return {
      valid: true,
      promotionCodeId: promoCode.id,
      couponName: coupon.name || promoCode.code || code.trim().toUpperCase(),
      percentOff: coupon.percent_off,
      amountOff: coupon.amount_off,
      currency: coupon.currency,
    }
  } catch (error) {
    console.error('Error validating promotion code:', error)
    return { valid: false, error: 'Wystąpił błąd podczas weryfikacji kodu.' }
  }
}
