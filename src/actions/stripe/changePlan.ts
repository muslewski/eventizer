// src/actions/stripe/changePlan.ts
'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { stripe } from '@/lib/stripe'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { revalidatePath } from 'next/cache'
import type { SubscriptionPlan, User } from '@/payload-types'
import type Stripe from 'stripe'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type ChangePlanError =
  | 'UNAUTHORIZED' | 'STALE_PLAN' | 'NO_ACTIVE_SUB' | 'MULTIPLE_ITEMS'
  | 'PRICE_PLAN_MISMATCH' | 'CATEGORY_INVALID' | 'CURRENCY_MISMATCH' | 'PLAN_NOT_FOUND'

export type ChangePlanResult =
  | { success: true; data: { changeType: string; requiresCheckoutRedirect?: boolean; checkoutUrl?: string } }
  | { success: false; error: ChangePlanError; message: string }

export async function changePlan({
  newPlanId,
  intervalKey,
  categoryNames,
  categorySlugs,
  expectedCurrentPlanId,
  keepScheduledCancel,
}: {
  newPlanId: number
  intervalKey: string
  categoryNames?: string[]
  categorySlugs?: string[]
  expectedCurrentPlanId: number | null
  keepScheduledCancel: boolean
}): Promise<ChangePlanResult> {
  const sessionUser = await getAuthenticatedUser()
  const payload = await getPayload({ config })
  const user = (await payload.findByID({
    collection: 'users',
    id: Number(sessionUser.id),
    depth: 0,
  })) as User

  // Beta users go through updateBetaUserPlan, not this action
  if (user.betaAccess) {
    return { success: false, error: 'UNAUTHORIZED', message: 'Użytkownicy beta używają innego endpointu.' }
  }

  if (user.role !== 'service-provider') {
    return { success: false, error: 'UNAUTHORIZED', message: 'Brak uprawnień.' }
  }

  // Validate categorySlugs length + existence
  if (categorySlugs && categorySlugs.length) {
    const totalLen = JSON.stringify(categorySlugs).length + JSON.stringify(categoryNames ?? []).length
    if (totalLen > 450) {
      return { success: false, error: 'CATEGORY_INVALID', message: 'Wybrana kategoria jest zbyt długa.' }
    }
    const topSlugs = Array.from(new Set(categorySlugs.map(s => s.split('/')[0])))
    const cats = await payload.find({
      collection: 'service-categories',
      where: { slug: { in: topSlugs } },
      limit: topSlugs.length,
      depth: 0,
    })
    if (cats.totalDocs < topSlugs.length) {
      return { success: false, error: 'CATEGORY_INVALID', message: 'Wybrana kategoria nie istnieje.' }
    }
  }

  // Resolve newPlan
  const newPlan = (await payload.findByID({
    collection: 'subscription-plans',
    id: newPlanId,
    depth: 0,
  })) as SubscriptionPlan | null
  if (!newPlan || !newPlan.stripeID) {
    return { success: false, error: 'PLAN_NOT_FOUND', message: 'Nie znaleziono planu.' }
  }

  const customerId = await getStripeCustomerId(user.id)
  const subscription = customerId ? await getActiveSubscription(customerId) : null

  // No active sub → route to checkout (new subscription)
  if (!subscription) {
    return await routeToCheckout({ user, newPlan, intervalKey, categoryNames, categorySlugs })
  }

  // Preconditions
  if (subscription.items.data.length !== 1) {
    return { success: false, error: 'MULTIPLE_ITEMS', message: 'Subskrypcja zawiera więcej niż jeden element — skontaktuj się z pomocą.' }
  }
  if (!['active', 'trialing'].includes(subscription.status)) {
    return await routeToCheckout({ user, newPlan, intervalKey, categoryNames, categorySlugs })
  }

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
  if (!currentPlan) {
    return { success: false, error: 'PLAN_NOT_FOUND', message: 'Plan niezsynchronizowany.' }
  }

  // Optimistic concurrency
  if (expectedCurrentPlanId !== null && expectedCurrentPlanId !== currentPlan.id) {
    return { success: false, error: 'STALE_PLAN', message: 'Plan zmienił się w innej karcie.' }
  }

  // Server-resolve newPriceId from intervalKey
  const prices = await stripe.prices.list({ product: newPlan.stripeID, active: true, limit: 20 })
  const [interval, intervalCountStr] = intervalKey.split('/')
  const intervalCount = Number(intervalCountStr)
  const newPrice = prices.data.find(
    p => p.recurring?.interval === interval && p.recurring?.interval_count === intervalCount,
  )
  if (!newPrice) {
    return { success: false, error: 'PRICE_PLAN_MISMATCH', message: 'Cena niezgodna z planem.' }
  }
  if (newPrice.currency.toLowerCase() !== currentSubItem.price.currency.toLowerCase()) {
    return { success: false, error: 'CURRENCY_MISMATCH', message: 'Niezgodność walut — skontaktuj się z pomocą.' }
  }

  const newLevel = newPlan.level ?? 0
  const currentLevel = currentPlan.level ?? 0
  const changeType =
    currentPlan.id === newPlan.id && currentSubItem.price.id === newPrice.id ? 'no_change' :
    currentPlan.id === newPlan.id ? 'interval_only' :
    newLevel > currentLevel ? 'upgrade' :
    newLevel < currentLevel ? 'downgrade' : 'lateral'

  if (changeType === 'no_change') {
    return { success: true, data: { changeType: 'no_change' } }
  }

  // cancel_at_period_end clearing — only when both opted in AND subscription actually has it true
  const shouldClearCancel = !keepScheduledCancel && subscription.cancel_at_period_end === true

  const updateParams: Stripe.SubscriptionUpdateParams = {
    items: [{ id: currentSubItem.id, price: newPrice.id }],
    proration_behavior: changeType === 'downgrade' ? 'none' : 'create_prorations',
    metadata: {
      categoryNames: JSON.stringify(categoryNames ?? []),
      categorySlugs: JSON.stringify(categorySlugs ?? []),
      planSlug: newPlan.slug ?? '',
      changeType,
    },
  }
  if (shouldClearCancel) updateParams.cancel_at_period_end = false

  const idempotencyKey = `change-plan-${user.id}-${subscription.id}-${newPrice.id}-${expectedCurrentPlanId ?? 'init'}`

  await stripe.subscriptions.update(subscription.id, updateParams, { idempotencyKey })

  // Write-through for UI consistency (webhook is authoritative for drafting only)
  await syncUserFromPlan({
    payload,
    userId: user.id,
    newPlan,
    categoryNames,
    categorySlugs,
  })

  revalidatePath('/panel/plan-subskrypcji')
  revalidatePath('/panel/oferty')

  return { success: true, data: { changeType } }
}

async function routeToCheckout({
  user,
  newPlan,
  intervalKey,
  categoryNames,
  categorySlugs,
}: {
  user: User
  newPlan: SubscriptionPlan
  intervalKey: string
  categoryNames?: string[]
  categorySlugs?: string[]
}): Promise<ChangePlanResult> {
  if (!newPlan.stripeID) {
    return { success: false, error: 'PLAN_NOT_FOUND', message: 'Plan nie ma przypisanego produktu Stripe.' }
  }
  const prices = await stripe.prices.list({ product: newPlan.stripeID, active: true, limit: 20 })
  const [interval, intervalCountStr] = intervalKey.split('/')
  const intervalCount = Number(intervalCountStr)
  const price = prices.data.find(
    p => p.recurring?.interval === interval && p.recurring?.interval_count === intervalCount,
  )
  if (!price) {
    return { success: false, error: 'PRICE_PLAN_MISMATCH', message: 'Cena niezgodna z planem.' }
  }

  const result = await createCheckoutSession({
    priceId: price.id,
    userId: user.id,
    successUrl: `/pl/panel/plan-subskrypcji?success=1`,
    cancelUrl: `/pl/panel/plan-subskrypcji`,
    categoryNames: categoryNames ?? [],
    categorySlugs: categorySlugs ?? [],
    userEmail: user.email,
  })
  if (result.url) {
    return { success: true, data: { changeType: 'new_checkout', requiresCheckoutRedirect: true, checkoutUrl: result.url } }
  }
  return { success: false, error: 'NO_ACTIVE_SUB', message: 'Nie udało się utworzyć sesji płatności.' }
}
