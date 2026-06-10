import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetSession, mockPayload } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockPayload: {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/auth/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => mockPayload) }))

import { getOffers, getOffer, updateOffer, toggleOfferStatus } from '@/actions/panel/offers'

/** Route findByID by collection: users + offers fixtures keyed by id. */
const fixtures = (opts: {
  users?: Record<number, { id: number; role: string; maxOffers?: number }>
  offers?: Record<number, { id: number; user: number | { id: number } }>
}) => {
  mockPayload.findByID.mockImplementation(async ({ collection, id }: { collection: string; id: number }) => {
    if (collection === 'users') return opts.users?.[id] ?? null
    if (collection === 'offers') return opts.offers?.[id] ?? null
    return null
  })
}

const session = (id: number) => mockGetSession.mockResolvedValue({ user: { id } })
const noSession = () => mockGetSession.mockResolvedValue(null)

beforeEach(() => {
  vi.clearAllMocks()
  mockPayload.find.mockResolvedValue({ docs: [], totalDocs: 0 })
  mockPayload.update.mockResolvedValue({ id: 5 })
})

describe('updateOffer ownership', () => {
  it('rejects updating an offer owned by another user', async () => {
    session(1)
    fixtures({
      users: { 1: { id: 1, role: 'service-provider', maxOffers: 1 } },
      offers: { 5: { id: 5, user: 2 } },
    })

    const res = await updateOffer(5, { title: 'hijack' })

    expect(res.success).toBe(false)
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('allows the owner to update their own offer (populated user object)', async () => {
    session(1)
    fixtures({
      users: { 1: { id: 1, role: 'service-provider', maxOffers: 1 } },
      offers: { 5: { id: 5, user: { id: 1 } } },
    })

    const res = await updateOffer(5, { title: 'mine' })

    expect(res.success).toBe(true)
    expect(mockPayload.update).toHaveBeenCalledTimes(1)
  })

  it('allows moderators to update another user’s offer', async () => {
    session(9)
    fixtures({
      users: { 9: { id: 9, role: 'moderator', maxOffers: 1 } },
      offers: { 5: { id: 5, user: 2 } },
    })

    const res = await updateOffer(5, { title: 'moderated' })

    expect(res.success).toBe(true)
    expect(mockPayload.update).toHaveBeenCalledTimes(1)
  })

  it('strips the user field so owners cannot reassign their offer', async () => {
    session(1)
    fixtures({
      users: { 1: { id: 1, role: 'service-provider', maxOffers: 1 } },
      offers: { 5: { id: 5, user: 1 } },
    })

    await updateOffer(5, { title: 'ok', user: 2 } as never)

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ user: 2 }) }),
    )
  })
})

describe('toggleOfferStatus ownership', () => {
  it('rejects toggling an offer owned by another user', async () => {
    session(1)
    fixtures({
      users: { 1: { id: 1, role: 'service-provider', maxOffers: 1 } },
      offers: { 5: { id: 5, user: 2 } },
    })

    const res = await toggleOfferStatus(5, 'published')

    expect(res.success).toBe(false)
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('allows the owner to toggle their own offer', async () => {
    session(1)
    fixtures({
      users: { 1: { id: 1, role: 'service-provider', maxOffers: 1 } },
      offers: { 5: { id: 5, user: 1 } },
    })

    const res = await toggleOfferStatus(5, 'published')

    expect(res.success).toBe(true)
    expect(mockPayload.update).toHaveBeenCalledTimes(1)
  })
})

describe('getOffers authentication & scoping', () => {
  it('rejects unauthenticated callers', async () => {
    noSession()

    const res = await getOffers(2)

    expect(res.success).toBe(false)
    expect(mockPayload.find).not.toHaveBeenCalled()
  })

  it('forces regular users onto their own offers even when asking for another userId', async () => {
    session(1)
    fixtures({ users: { 1: { id: 1, role: 'service-provider' } } })

    await getOffers(2)

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ user: { equals: 1 } }) }),
    )
  })

  it('lets moderators query another user’s offers (admin-views-provider)', async () => {
    session(9)
    fixtures({ users: { 9: { id: 9, role: 'moderator' } } })

    await getOffers(2)

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ user: { equals: 2 } }) }),
    )
  })
})

describe('getOffer authentication', () => {
  it('rejects unauthenticated callers', async () => {
    noSession()

    const res = await getOffer('some-slug', 2)

    expect(res.success).toBe(false)
    expect(mockPayload.find).not.toHaveBeenCalled()
  })
})
