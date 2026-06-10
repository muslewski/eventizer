import { describe, it, expect, vi } from 'vitest'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'

const makePayload = (offers: any[], categories: any[]) =>
  ({
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'offers') return { docs: offers, totalDocs: offers.length }
      if (collection === 'service-categories')
        return { docs: categories, totalDocs: categories.length }
      return { docs: [], totalDocs: 0 }
    }),
    update: vi.fn(async () => ({})),
  }) as any

const planT1 = { level: 1, maxOffers: 1, slug: 'single' }
const planT4 = { level: 4, maxOffers: 4, slug: 'multi' }

const offer = (id: number, slug: string, createdAt: string) => ({
  id, _status: 'published', user: 1, category: slug, createdAt,
})

const cat = (slug: string, requiredPlanLevel: number) => ({
  slug, requiredPlan: { level: requiredPlanLevel },
  subcategory_level_1: [], subcategory_level_2: [],
})

describe('draftOffersOnDowngrade', () => {
  it('Pass A only: drafts offers whose category exceeds new plan level', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),  // ok (cat level 1)
      offer(2, 'photo', '2026-01-02'),  // too high (cat level 3)
    ]
    const categories = [cat('music', 1), cat('photo', 3)]
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT1, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([2])
    expect(result.draftedByLimit).toEqual([])
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 2, data: { _status: 'draft' },
    }))
  })

  it('Pass B only: drafts excess by oldest-kept rule when all categories fit', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),
      offer(2, 'music', '2026-01-02'),
      offer(3, 'music', '2026-01-03'),
    ]
    const categories = [cat('music', 1)]
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT1, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([])
    expect(result.draftedByLimit).toEqual([2, 3])
  })

  it('Both passes: category violations first, then limit cap', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),  // ok
      offer(2, 'music', '2026-01-02'),  // ok
      offer(3, 'photo', '2026-01-03'),  // category violation
    ]
    const categories = [cat('music', 1), cat('photo', 3)]
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT1, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([3])
    expect(result.draftedByLimit).toEqual([2])
  })

  it('dryRun does not call update', async () => {
    const offers = [
      offer(1, 'music', '2026-01-01'),
      offer(2, 'music', '2026-01-02'),
    ]
    const categories = [cat('music', 1)]
    const payload = makePayload(offers, categories)

    await draftOffersOnDowngrade({ payload, userId: 1, newPlan: planT1, dryRun: true })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('Offers with no resolvable category are left untouched by Pass A', async () => {
    const offers = [offer(1, 'deleted-cat', '2026-01-01')]
    const categories: any[] = []
    const payload = makePayload(offers, categories)

    const result = await draftOffersOnDowngrade({
      payload, userId: 1, newPlan: planT4, dryRun: false,
    })
    expect(result.draftedByCategory).toEqual([])
    expect(result.draftedByLimit).toEqual([])
  })

  it('Always reads current state, never trusts event payload', async () => {
    const payload = makePayload([], [])
    await draftOffersOnDowngrade({ payload, userId: 1, newPlan: planT1, dryRun: false })
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'offers',
      where: expect.objectContaining({ _status: { equals: 'published' } }),
    }))
  })
})
