import type { Payload } from 'payload'
import type Stripe from 'stripe'
import { deduplicateStripeEvent } from '@/lib/stripe/deduplicateStripeEvent'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'

export interface HandleSubscriptionUpdatedInput {
  payload: Payload
  event: Stripe.Event
}

interface AuditFields {
  changeType: 'upgrade' | 'downgrade' | 'lateral' | 'interval_only' | 'no_change' | 'other'
  prevPlanSlug?: string
  newPlanSlug?: string
  prevLevel?: number
  newLevel?: number
  draftedByCategory?: number
  draftedByLimit?: number
  user?: number
  subscriptionId?: string
}

export async function handleSubscriptionUpdated({
  payload,
  event,
}: HandleSubscriptionUpdatedInput): Promise<void> {
  const isNew = await deduplicateStripeEvent(payload, event.id)
  if (!isNew) return

  const subscription = event.data.object as Stripe.Subscription
  const previousAttributes = (event.data.previous_attributes ?? {}) as any
  const audit: AuditFields = { changeType: 'other', subscriptionId: subscription.id }

  try {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id
    const customerRow = await payload.find({
      collection: 'stripe-customers',
      where: { stripeID: { equals: customerId } },
      limit: 1,
      depth: 1,
    })
    const linkedUser = customerRow.docs[0]?.user
    const userId = typeof linkedUser === 'object' ? linkedUser?.id : linkedUser
    if (!userId) {
      await recordEvent(payload, event, audit)
      return
    }
    audit.user = userId

    const currentPriceId = subscription.items.data[0]?.price.id
    const previousPriceId = previousAttributes?.items?.data?.[0]?.price?.id
    if (!previousAttributes.items || !previousPriceId || previousPriceId === currentPriceId) {
      await recordEvent(payload, event, audit)
      return
    }

    const currentProductId = typeof subscription.items.data[0].price.product === 'string'
      ? subscription.items.data[0].price.product
      : subscription.items.data[0].price.product.id
    const newPlanResult = await payload.find({
      collection: 'subscription-plans',
      where: { stripeID: { equals: currentProductId } },
      limit: 1,
    })
    const newPlan = newPlanResult.docs[0]
    if (!newPlan) {
      console.warn(`customer.subscription.updated: no Payload plan for product ${currentProductId} (event ${event.id})`)
      await recordEvent(payload, event, audit)
      return
    }
    audit.newPlanSlug = newPlan.slug
    audit.newLevel = newPlan.level

    let previousPlan: { level: number; slug: string } | undefined
    const previousProductId = previousAttributes.items?.data?.[0]?.price?.product
    if (previousProductId) {
      const previousPlanResult = await payload.find({
        collection: 'subscription-plans',
        where: { stripeID: { equals: previousProductId } },
        limit: 1,
      })
      if (previousPlanResult.docs[0]) {
        previousPlan = {
          level: previousPlanResult.docs[0].level,
          slug: previousPlanResult.docs[0].slug,
        }
        audit.prevPlanSlug = previousPlan.slug
        audit.prevLevel = previousPlan.level
      }
    }

    if (previousPlan) {
      if (newPlan.level > previousPlan.level) audit.changeType = 'upgrade'
      else if (newPlan.level < previousPlan.level) audit.changeType = 'downgrade'
      else audit.changeType = 'lateral'
    }

    const metadata = subscription.metadata as Record<string, string> | null | undefined
    const hasMetadataCategory = metadata?.categorySlugs && metadata.categorySlugs !== '[]'
    let categoryNames: string[] | undefined
    let categorySlugs: string[] | undefined
    if (hasMetadataCategory) {
      try {
        categoryNames = JSON.parse(metadata!.categoryNames ?? '[]')
        categorySlugs = JSON.parse(metadata!.categorySlugs ?? '[]')
      } catch {
        // malformed metadata — treat as absent
      }
    }
    await syncUserFromPlan({
      payload,
      userId,
      newPlan,
      categoryNames,
      categorySlugs,
      preserveCategoryIfSingle: !hasMetadataCategory,
    })

    if (previousPlan && newPlan.level < previousPlan.level) {
      const result = await draftOffersOnDowngrade({ payload, userId, newPlan })
      audit.draftedByCategory = result.draftedByCategory.length
      audit.draftedByLimit = result.draftedByLimit.length
    }
  } catch (err) {
    console.error(`customer.subscription.updated handler error (event ${event.id}):`, err)
  } finally {
    await recordEvent(payload, event, audit)
  }
}

async function recordEvent(payload: Payload, event: Stripe.Event, audit: AuditFields): Promise<void> {
  try {
    await payload.create({
      collection: 'processed-stripe-events',
      data: {
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
        ...audit,
      } as any,
    })
  } catch (err) {
    console.warn(`recordEvent: failed to record ${event.id}`, err)
  }
}
