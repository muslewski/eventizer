import type { SubscriptionPlan } from '@/payload-types'

/**
 * User-facing plan display name. In Stripe we split the single-offer plan into
 * three internal tiers (Single, Single+, Single++) that differ only by which
 * categories they unlock. To users, all three are presented as "Plan Single" —
 * the variation is reflected in the price, not the plan name.
 *
 * Multi and Agency tiers keep their full plan name since they ARE distinct
 * products to the user.
 *
 * Detection is intentionally permissive: matches either the slug OR the plan's
 * stored name against the word "single" (case-insensitive). This lets the helper
 * survive whatever naming convention the admin used in Payload (e.g. `single`,
 * `single-plus`, `plan-single-plus-plus`, "Plan Single+", "Single++").
 */
export function getDisplayPlanName(plan: SubscriptionPlan | undefined | null): string {
  if (!plan) return ''
  const haystack = `${plan.slug ?? ''} ${plan.name ?? ''}`.toLowerCase()
  if (haystack.includes('single')) return 'Plan Single'
  return plan.name ?? ''
}
