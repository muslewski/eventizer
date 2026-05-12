'use server'

import { changePlan } from '@/actions/stripe/changePlan'

export interface UpdateSubscriptionResult {
  success: boolean
  message: string
  action?: 'upgraded' | 'downgraded' | 'same_plan' | 'category_only' | 'no_change'
}

/**
 * @deprecated Use changePlan directly. This alias preserves backward compatibility
 * with any caller that hasn't been migrated yet. The new signature derives userId
 * from session (Better Auth) — caller-supplied userId is no longer accepted.
 */
export async function updateSubscription({
  newProductId,
  newPriceId,
  categoryNames,
  categorySlugs,
}: {
  newProductId: string
  newPriceId?: string
  categoryNames: string[]
  categorySlugs: string[]
  /** @deprecated No longer used — userId is derived from session. */
  userId?: number
}): Promise<UpdateSubscriptionResult> {
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  const payload = await getPayload({ config })

  const planResult = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: newProductId } },
    limit: 1,
  })
  const newPlan = planResult.docs[0]
  if (!newPlan) return { success: false, message: 'Plan not found' }

  // Translate newPriceId (optional) → intervalKey. Default month/1.
  let intervalKey = 'month/1'
  if (newPriceId) {
    const { stripe } = await import('@/lib/stripe')
    const price = await stripe.prices.retrieve(newPriceId)
    intervalKey = `${price.recurring?.interval ?? 'month'}/${price.recurring?.interval_count ?? 1}`
  }

  const result = await changePlan({
    newPlanId: newPlan.id,
    intervalKey,
    categoryNames,
    categorySlugs,
    expectedCurrentPlanId: null,
    keepScheduledCancel: true,
  })

  if (!result.success) return { success: false, message: result.message }

  const actionMap: Record<string, UpdateSubscriptionResult['action']> = {
    upgrade: 'upgraded',
    downgrade: 'downgraded',
    interval_only: 'same_plan',
    no_change: 'no_change',
    lateral: 'same_plan',
    new_checkout: 'same_plan',
  }
  return {
    success: true,
    message: 'Plan updated.',
    action: actionMap[result.data.changeType] ?? 'same_plan',
  }
}
