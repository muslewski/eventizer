import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockPayload } = vi.hoisted(() => ({
  mockPayload: {
    find: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => mockPayload) }))

import { GET } from '@/app/api/cron/purge-stripe-events/route'

const request = (authHeader?: string) =>
  new Request('http://localhost/api/cron/purge-stripe-events', {
    headers: authHeader ? { authorization: authHeader } : {},
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockPayload.find.mockResolvedValue({ docs: [{ id: 1 }, { id: 2 }], totalDocs: 2 })
  mockPayload.delete.mockResolvedValue({ docs: [{ id: 1 }, { id: 2 }], errors: [] })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('purge-stripe-events cron auth', () => {
  it('fails closed when CRON_SECRET is unset — "Bearer undefined" must not pass', async () => {
    vi.stubEnv('CRON_SECRET', '')
    delete process.env.CRON_SECRET

    const res = await GET(request('Bearer undefined'))

    expect(res.status).toBe(401)
    expect(mockPayload.delete).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret')

    const res = await GET(request('Bearer wrong'))

    expect(res.status).toBe(401)
    expect(mockPayload.delete).not.toHaveBeenCalled()
  })

  it('purges in a single bulk delete with the cutoff where-clause', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret')

    const res = await GET(request('Bearer s3cret'))

    expect(res.status).toBe(200)
    expect(mockPayload.delete).toHaveBeenCalledTimes(1)
    expect(mockPayload.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'processed-stripe-events',
        where: expect.objectContaining({
          processedAt: expect.objectContaining({ less_than: expect.any(String) }),
        }),
      }),
    )
    const json = await res.json()
    expect(json.deleted).toBe(2)
  })
})
