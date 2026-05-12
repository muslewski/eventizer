import { describe, it, expect, vi } from 'vitest'
import { deduplicateStripeEvent } from '@/lib/stripe/deduplicateStripeEvent'

describe('deduplicateStripeEvent', () => {
  it('returns false when event is already in the collection', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 1, eventId: 'evt_123' }], totalDocs: 1 }),
    } as any
    const isNew = await deduplicateStripeEvent(payload, 'evt_123')
    expect(isNew).toBe(false)
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'processed-stripe-events',
      where: { eventId: { equals: 'evt_123' } },
      limit: 1,
      depth: 0,
    })
  })

  it('returns true when event has not been seen', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    } as any
    expect(await deduplicateStripeEvent(payload, 'evt_456')).toBe(true)
  })
})
