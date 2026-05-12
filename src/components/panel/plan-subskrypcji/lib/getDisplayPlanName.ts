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

/**
 * Resolve the user's current plan from local state (`user.maxOffers`) rather
 * than via Stripe's `subscriptions.list` API. The Stripe list endpoint has a
 * brief read-after-write inconsistency window — immediately after we update a
 * subscription, a subsequent `list` call can still return the previous price /
 * product for ~hundreds of milliseconds. Since `changePlan` writes
 * `user.maxOffers` synchronously via `syncUserFromPlan`, that local value is
 * always fresher and more authoritative for display purposes than the Stripe
 * round-trip.
 *
 * We match plans by `maxOffers` (1 → any Single tier, 4 → Multi, 10 → Agency).
 * `getDisplayPlanName` then collapses the three Single tiers into a single
 * "Plan Single" string anyway, so picking any plan with `maxOffers === 1` is
 * fine for display.
 */
export function resolveCurrentPlanByMaxOffers(
  maxOffers: number | null | undefined,
  plans: SubscriptionPlan[],
): SubscriptionPlan | undefined {
  const target = maxOffers ?? 1
  return plans.find((p) => (p.maxOffers ?? 1) === target)
}
