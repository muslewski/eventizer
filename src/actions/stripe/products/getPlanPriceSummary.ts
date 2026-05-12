'use server'

import { unstable_cache } from 'next/cache'
import { getStripePrices, type StripePriceDetails } from './getStripePrices'

export interface PlanPriceSummary {
  monthly: { id: string; amount: number; currency: string } | null
  yearly: { id: string; amount: number; currency: string } | null
}

const cacheKey = 'stripe-plan-price-summary'
const cacheTTL = 60 * 60 // 1 hour

/**
 * Returns the cheapest 1-month and 1-year recurring price for a plan, used
 * by the wizard's plan-picker step to show subtle pricing strips. Cached
 * for 1h to avoid hitting Stripe on every page render. Returns nulls on
 * Stripe failure so the UI can show "Cena niedostępna".
 */
export async function getPlanPriceSummary(productId: string): Promise<PlanPriceSummary> {
  if (!productId) return { monthly: null, yearly: null }

  return unstable_cache(
    async (): Promise<PlanPriceSummary> => {
      try {
        const result = await getStripePrices(productId)
        if (!result.success) return { monthly: null, yearly: null }

        const monthly = pickCheapest(result.prices, 'month', 1)
        const yearly = pickCheapest(result.prices, 'year', 1)

        return {
          monthly: monthly
            ? { id: monthly.id, amount: monthly.unitAmount ?? 0, currency: monthly.currency }
            : null,
          yearly: yearly
            ? { id: yearly.id, amount: yearly.unitAmount ?? 0, currency: yearly.currency }
            : null,
        }
      } catch (err) {
        console.error(`[getPlanPriceSummary] failed for ${productId}`, err)
        return { monthly: null, yearly: null }
      }
    },
    [cacheKey, productId],
    { revalidate: cacheTTL, tags: [`${cacheKey}:${productId}`] },
  )()
}

function pickCheapest(
  prices: StripePriceDetails[],
  interval: 'month' | 'year',
  intervalCount: number,
): StripePriceDetails | null {
  const matching = prices
    .filter(
      (p) =>
        p.recurring?.interval === interval && p.recurring.intervalCount === intervalCount,
    )
    .sort((a, b) => (a.unitAmount ?? 0) - (b.unitAmount ?? 0))
  return matching[0] ?? null
}
