import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSubscriptionUpdatedEvent } from './_stripe-event-fixtures'
import { handleSubscriptionUpdated } from '@/plugins/handlers/handleSubscriptionUpdated'

const planT2 = { id: 2, level: 2, maxOffers: 1, slug: 'single-plus', stripeID: 'prod_t2' }
const planT4 = { id: 4, level: 4, maxOffers: 4, slug: 'multi', stripeID: 'prod_t4' }

const makePayload = (overrides?: any) => ({
  find: vi.fn(async ({ collection, where }: any) => {
    if (collection === 'stripe-customers' && where?.stripeID?.equals === 'cus_test_1') {
      return { docs: [{ user: { id: 1 } }], totalDocs: 1 }
    }
    if (collection === 'subscription-plans' && where?.stripeID?.equals === 'prod_t4') {
      return { docs: [planT4], totalDocs: 1 }
    }
    if (collection === 'subscription-plans' && where?.stripeID?.equals === 'prod_t2') {
      return { docs: [planT2], totalDocs: 1 }
    }
    if (collection === 'offers') return { docs: [], totalDocs: 0 }
    if (collection === 'processed-stripe-events') return { docs: [], totalDocs: 0 }
    return { docs: [], totalDocs: 0 }
  }),
  update: vi.fn(async () => ({})),
  create: vi.fn(async () => ({})),
  ...overrides,
})

describe('customer.subscription.updated handler', () => {
  let payload: any
  beforeEach(() => { payload = makePayload() })

  it('dedup early-return when event was already processed', async () => {
    payload.find.mockImplementationOnce(async ({ collection }: any) => {
      if (collection === 'processed-stripe-events') return { docs: [{ id: 1 }], totalDocs: 1 }
      return { docs: [], totalDocs: 0 }
    })
    const event = makeSubscriptionUpdatedEvent({ currentProductId: 'prod_t4' })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('skips when previous_attributes.items is absent (non-plan update)', async () => {
    const event = makeSubscriptionUpdatedEvent({ currentProductId: 'prod_t4', previousPriceId: undefined })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'processed-stripe-events',
      data: expect.objectContaining({ changeType: 'other' }),
    }))
    expect(payload.update).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'users' }))
  })

  it('skips when price unchanged (early return)', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentPriceId: 'price_x',
      previousPriceId: 'price_x',
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'users' }))
  })

  it('sets user.maxOffers on upgrade', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentProductId: 'prod_t4',
      previousPriceId: 'price_t2',
      metadata: { planSlug: 'multi', changeType: 'upgrade' },
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 1,
      data: { maxOffers: 4, serviceCategory: null, serviceCategorySlug: null },
    })
  })

  it('records the event in processed-stripe-events with audit fields', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentProductId: 'prod_t4',
      previousPriceId: 'price_t2',
      metadata: { planSlug: 'multi', changeType: 'upgrade' },
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'processed-stripe-events',
      data: expect.objectContaining({
        eventId: 'evt_test_1',
        eventType: 'customer.subscription.updated',
        user: 1,
        subscriptionId: 'sub_test_1',
        newPlanSlug: 'multi',
        newLevel: 4,
      }),
    }))
  })

  it('preserves serviceCategory on Single→Single Portal swap (no metadata)', async () => {
    const event = makeSubscriptionUpdatedEvent({
      currentProductId: 'prod_t2',
      previousPriceId: 'price_t1',
      metadata: {},
    })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 1,
      data: { maxOffers: 1 },
    })
  })

  it('does not clobber maxOffers when Stripe product is not in Payload', async () => {
    payload.find.mockImplementation(async ({ collection }: any) => {
      if (collection === 'stripe-customers') return { docs: [{ user: { id: 1 } }], totalDocs: 1 }
      if (collection === 'subscription-plans') return { docs: [], totalDocs: 0 }
      if (collection === 'processed-stripe-events') return { docs: [], totalDocs: 0 }
      return { docs: [], totalDocs: 0 }
    })
    const event = makeSubscriptionUpdatedEvent({ currentProductId: 'prod_unknown', previousPriceId: 'price_old' })
    await handleSubscriptionUpdated({ payload, event })
    expect(payload.update).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'users' }))
  })
})
