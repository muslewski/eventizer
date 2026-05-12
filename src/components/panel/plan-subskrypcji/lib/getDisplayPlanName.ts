import type { SubscriptionPlan } from '@/payload-types'

/**
 * User-facing plan display name. In Stripe we split the single-offer plan into
 * three internal tiers (Single, Single+, Single++) that differ only by which
 * categories they unlock. To users, all three are presented as "Single" — the
 * variation is reflected in the price, not the plan name.
 *
 * Multi and Agency tiers keep their full plan name since they ARE distinct
 * products to the user.
 */
export function getDisplayPlanName(plan: SubscriptionPlan | undefined | null): string {
  if (!plan) return ''
  const slug = plan.slug ?? ''
  if (slug.startsWith('single')) return 'Single'
  return plan.name ?? ''
}
