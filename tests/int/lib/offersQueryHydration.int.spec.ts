import { describe, it, expect, vi } from 'vitest'
import {
  queryOffers,
  hydrateOffersByIds,
} from '@/app/(frontend)/[lang]/ogloszenia/ListView/utils/queryBuilder'
import type { ParsedSearchParams } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'

/**
 * Mock Payload whose `find`:
 *  - phase 2 (hydrate): when the where clause is `{ id: { in: [...] } }`, returns
 *    the requested rows in REVERSED order — proving hydrateOffersByIds re-orders
 *    them back to the requested sequence (Postgres `IN` doesn't preserve order).
 *  - phase 1 (lite): otherwise returns the provided lite docs + totalDocs.
 */
function makePayload(liteDocs: Array<{ id: number }>) {
  const find = vi.fn(async (args: any) => {
    const inIds: number[] | undefined = args?.where?.id?.in
    if (inIds) {
      // Return in reversed order on purpose.
      const docs = [...inIds]
        .reverse()
        .map((id) => ({ id, title: `Offer ${id}`, _status: 'published' }))
      return { docs, totalDocs: docs.length }
    }
    return { docs: liteDocs, totalDocs: liteDocs.length }
  })
  return { payload: { find } as any, find }
}

const lite = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }))

const base: ParsedSearchParams = { page: 1, limit: 10, sortuj: 'random', seed: 123 }

describe('hydrateOffersByIds', () => {
  it('returns rows in the requested id order regardless of DB order', async () => {
    const { payload, find } = makePayload([])
    const out = await hydrateOffersByIds(payload, [3, 1, 2])
    expect(out.map((o) => o.id)).toEqual([3, 1, 2]) // mock returned [2,1,3]
    expect(find).toHaveBeenCalledTimes(1)
    expect(find.mock.calls[0][0].where).toEqual({ id: { in: [3, 1, 2] } })
  })

  it('short-circuits on an empty id list without querying', async () => {
    const { payload, find } = makePayload([])
    const out = await hydrateOffersByIds(payload, [])
    expect(out).toEqual([])
    expect(find).not.toHaveBeenCalled()
  })

  it('drops ids that no longer resolve to a row', async () => {
    // find returns only id 1 (id 2 was deleted between phases)
    const find = vi.fn(async () => ({ docs: [{ id: 1 }], totalDocs: 1 }))
    const out = await hydrateOffersByIds({ find } as any, [1, 2])
    expect(out.map((o) => o.id)).toEqual([1])
  })
})

describe('queryOffers — two-phase fetch (random sort, no search/geo)', () => {
  it('hydrates only the current page, not the whole catalogue', async () => {
    const { payload, find } = makePayload(lite(25))
    const res = await queryOffers(payload, base)

    // Phase 1 is the lite fetch: limit 0, depth 0, with a select.
    const phase1 = find.mock.calls[0][0]
    expect(phase1.limit).toBe(0)
    expect(phase1.depth).toBe(0)
    expect(phase1.select).toBeDefined()

    // Phase 2 hydrates exactly one page worth of ids.
    const phase2 = find.mock.calls[1][0]
    expect(phase2.where.id.in).toHaveLength(10)

    expect(find).toHaveBeenCalledTimes(2)
    expect(res.offers).toHaveLength(10)
  })

  it('preserves the in-memory sort order through hydration', async () => {
    const { payload, find } = makePayload(lite(25))
    const res = await queryOffers(payload, base)
    const requestedIds = find.mock.calls[1][0].where.id.in
    // Even though the hydrate mock returns reversed docs, the result matches
    // the order the sort/slice asked for.
    expect(res.offers.map((o) => o.id)).toEqual(requestedIds)
  })

  it('reports pagination from the full lite count, not the page size', async () => {
    const { payload } = makePayload(lite(25))
    const res = await queryOffers(payload, base)
    expect(res.pagination.totalDocs).toBe(25)
    expect(res.pagination.totalPages).toBe(3)
    expect(res.pagination.currentPage).toBe(1)
    expect(res.pagination.hasNextPage).toBe(true)
  })

  it('is deterministic for a given seed', async () => {
    const a = makePayload(lite(25))
    const b = makePayload(lite(25))
    const resA = await queryOffers(a.payload, { ...base, seed: 7 })
    const resB = await queryOffers(b.payload, { ...base, seed: 7 })
    expect(resA.offers.map((o) => o.id)).toEqual(resB.offers.map((o) => o.id))
  })

  it('returns a different page-2 slice with no overlap', async () => {
    const p1 = makePayload(lite(25))
    const p2 = makePayload(lite(25))
    const page1 = await queryOffers(p1.payload, { ...base, page: 1 })
    const page2 = await queryOffers(p2.payload, { ...base, page: 2 })
    const ids1 = new Set(page1.offers.map((o) => o.id))
    const overlap = page2.offers.filter((o) => ids1.has(o.id))
    expect(overlap).toHaveLength(0)
    expect(page2.offers).toHaveLength(10)
  })
})
