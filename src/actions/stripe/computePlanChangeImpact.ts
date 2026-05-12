'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { stripe } from '@/lib/stripe'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'
import type { SubscriptionPlan } from '@/payload-types'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type PlanChangeType = 'upgrade' | 'downgrade' | 'lateral' | 'interval_only' | 'no_change'

export interface PlanChangeImpact {
  changeType: PlanChangeType
  currentPlan: SubscriptionPlan
  newPlan: SubscriptionPlan
  newPrice: { id: string; unitAmount: number; currency: string; interval: string; intervalCount: number }
  categoryWillBeCleared: boolean
  offersToDraft: {
    byCategory: { id: number; title: string; categorySlugPath: string }[]
    byLimit: { id: number; title: string }[]
  }
  offersToKeepPublished: { id: number; title: string }[]
  intervalChange?: { fromLabel: string; toLabel: string }
  currencyMismatch: boolean
  hasScheduledCancel: boolean
  isTrialing: boolean
  trialEnd?: string
}

export type ComputePlanChangeImpactResult =
  | { success: true; data: PlanChangeImpact }
  | { success: false; error: 'UNAUTHORIZED' | 'NO_ACTIVE_SUB' | 'PRICE_PLAN_MISMATCH' | 'PLAN_NOT_FOUND'; message: string }

export async function computePlanChangeImpact({
  newPlanId,
  intervalKey,
}: {
  newPlanId: number
  intervalKey: string
}): Promise<ComputePlanChangeImpactResult> {
  const sessionUser = await getAuthenticatedUser()
  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: Number(sessionUser.id), depth: 0 })

  if (user.role !== 'service-provider') {
    return { success: false, error: 'UNAUTHORIZED', message: 'Brak uprawnień.' }
  }

  const customerId = await getStripeCustomerId(user.id)
  if (!customerId) return { success: false, error: 'NO_ACTIVE_SUB', message: 'Brak aktywnej subskrypcji.' }

  const subscription = await getActiveSubscription(customerId)
  if (!subscription) return { success: false, error: 'NO_ACTIVE_SUB', message: 'Brak aktywnej subskrypcji.' }

  const newPlan = (await payload.findByID({ collection: 'subscription-plans', id: newPlanId, depth: 0 })) as SubscriptionPlan | null
  if (!newPlan || !newPlan.stripeID) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Nie znaleziono planu.' }

  const prices = await stripe.prices.list({ product: newPlan.stripeID, active: true, limit: 20 })
  const [interval, intervalCountStr] = intervalKey.split('/')
  const intervalCount = Number(intervalCountStr)
  const newPrice = prices.data.find(p => p.recurring?.interval === interval && p.recurring?.interval_count === intervalCount)
  if (!newPrice) return { success: false, error: 'PRICE_PLAN_MISMATCH', message: 'Wybrana cena nie pasuje do planu.' }

  const currentSubItem = subscription.items.data[0]
  const currentProductId = typeof currentSubItem.price.product === 'string'
    ? currentSubItem.price.product
    : currentSubItem.price.product.id
  const currentPlanResult = await payload.find({
    collection: 'subscription-plans',
    where: { stripeID: { equals: currentProductId } },
    limit: 1,
  })
  const currentPlan = currentPlanResult.docs[0] as SubscriptionPlan | undefined
  if (!currentPlan) return { success: false, error: 'PLAN_NOT_FOUND', message: 'Plan niezsynchronizowany.' }

  const samePlan = currentPlan.id === newPlan.id
  const samePrice = currentSubItem.price.id === newPrice.id
  const newLevel = newPlan.level ?? 0
  const currentLevel = currentPlan.level ?? 0
  let changeType: PlanChangeType
  if (samePlan && samePrice) changeType = 'no_change'
  else if (samePlan) changeType = 'interval_only'
  else if (newLevel > currentLevel) changeType = 'upgrade'
  else if (newLevel < currentLevel) changeType = 'downgrade'
  else changeType = 'lateral'

  const dryRunResult = changeType === 'downgrade'
    ? await draftOffersOnDowngrade({
        payload,
        userId: user.id,
        newPlan: { level: newLevel, maxOffers: newPlan.maxOffers ?? 1, slug: newPlan.slug ?? undefined },
        dryRun: true,
      })
    : { draftedByCategory: [], draftedByLimit: [], keptPublished: [] }

  const allOfferIds = [...dryRunResult.draftedByCategory, ...dryRunResult.draftedByLimit, ...dryRunResult.keptPublished]
  const offersResult = allOfferIds.length
    ? await payload.find({
        collection: 'offers',
        where: { id: { in: allOfferIds } },
        limit: 0,
        depth: 0,
      })
    : { docs: [] as any[] }
  const offerById = new Map(offersResult.docs.map((o: any) => [o.id, o]))

  const currencyMismatch = newPrice.currency.toLowerCase() !== currentSubItem.price.currency.toLowerCase()

  return {
    success: true,
    data: {
      changeType,
      currentPlan,
      newPlan,
      newPrice: {
        id: newPrice.id,
        unitAmount: newPrice.unit_amount ?? 0,
        currency: newPrice.currency,
        interval: newPrice.recurring?.interval ?? 'month',
        intervalCount: newPrice.recurring?.interval_count ?? 1,
      },
      categoryWillBeCleared: (currentPlan.maxOffers ?? 1) === 1 && (newPlan.maxOffers ?? 1) > 1,
      offersToDraft: {
        byCategory: dryRunResult.draftedByCategory.map(id => {
          const o: any = offerById.get(id)
          return { id, title: o?.title ?? '', categorySlugPath: o?.category ?? '' }
        }),
        byLimit: dryRunResult.draftedByLimit.map(id => {
          const o: any = offerById.get(id)
          return { id, title: o?.title ?? '' }
        }),
      },
      offersToKeepPublished: dryRunResult.keptPublished.map(id => {
        const o: any = offerById.get(id)
        return { id, title: o?.title ?? '' }
      }),
      currencyMismatch,
      hasScheduledCancel: subscription.cancel_at_period_end ?? false,
      isTrialing: subscription.status === 'trialing',
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
    },
  }
}
