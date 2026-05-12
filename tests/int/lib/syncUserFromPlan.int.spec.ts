import { describe, it, expect, vi } from 'vitest'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'

const makePayload = () => ({ update: vi.fn(async () => ({})) })

describe('syncUserFromPlan', () => {
  it('sets maxOffers + category fields for Single plan', async () => {
    const payload = makePayload()
    await syncUserFromPlan({
      payload: payload as any,
      userId: 1,
      newPlan: { maxOffers: 1 } as any,
      categoryNames: ['Music', 'DJ'],
      categorySlugs: ['music', 'dj'],
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 1,
      data: {
        maxOffers: 1,
        serviceCategory: 'Music > DJ',
        serviceCategorySlug: 'music/dj',
      },
    })
  })

  it('clears category fields for Multi/Agency plans (maxOffers > 1)', async () => {
    const payload = makePayload()
    await syncUserFromPlan({
      payload: payload as any,
      userId: 2,
      newPlan: { maxOffers: 4 } as any,
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 2,
      data: { maxOffers: 4, serviceCategory: null, serviceCategorySlug: null },
    })
  })

  it('preserves category fields when preserveCategoryIfSingle=true and no metadata', async () => {
    const payload = makePayload()
    await syncUserFromPlan({
      payload: payload as any,
      userId: 3,
      newPlan: { maxOffers: 1 } as any,
      preserveCategoryIfSingle: true,
    })
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 3,
      data: { maxOffers: 1 },
    })
  })
})
