import type Stripe from 'stripe'

export function makeSubscriptionUpdatedEvent({
  eventId = 'evt_test_1',
  subscriptionId = 'sub_test_1',
  customerId = 'cus_test_1',
  currentPriceId = 'price_new',
  currentProductId = 'prod_new',
  previousPriceId,
  metadata = {},
}: {
  eventId?: string
  subscriptionId?: string
  customerId?: string
  currentPriceId?: string
  currentProductId?: string
  previousPriceId?: string
  metadata?: Record<string, string>
}): Stripe.Event {
  return {
    id: eventId,
    type: 'customer.subscription.updated',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2024-12-18.acacia',
    pending_webhooks: 1,
    request: null,
    object: 'event',
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'active',
        cancel_at_period_end: false,
        metadata,
        items: { data: [{ id: 'si_1', price: { id: currentPriceId, product: currentProductId } }] },
      } as any,
      previous_attributes: previousPriceId
        ? { items: { data: [{ price: { id: previousPriceId } }] } as any }
        : undefined,
    },
  } as unknown as Stripe.Event
}
