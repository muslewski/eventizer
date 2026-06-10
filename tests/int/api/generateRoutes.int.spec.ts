import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetSession, mockStreamText } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockStreamText: vi.fn(() => ({
    toTextStreamResponse: () => new Response('generated'),
  })),
}))

vi.mock('@/auth/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('ai', () => ({ streamText: mockStreamText }))
vi.mock('@ai-sdk/openai', () => ({ openai: vi.fn(() => 'mock-model') }))

import { POST as generateContent } from '@/app/api/generate-content/route'
import { POST as generateDescription } from '@/app/api/generate-description/route'

const jsonRequest = (body: unknown) =>
  new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe.each([
  ['generate-content', generateContent],
  ['generate-description', generateDescription],
])('%s route', (_name, route) => {
  it('rejects unauthenticated requests with 401 and never calls the model', async () => {
    mockGetSession.mockResolvedValue(null)

    const res = await route(jsonRequest({ title: 'DJ na wesele' }))

    expect(res.status).toBe(401)
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it('rejects oversized input with 400 and never calls the model', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 1 } })

    const res = await route(jsonRequest({ title: 'x'.repeat(10_000) }))

    expect(res.status).toBe(400)
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it('streams a response for an authenticated, valid request', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 1 } })

    const res = await route(jsonRequest({ title: 'DJ na wesele', category: 'Muzyka' }))

    expect(res.status).toBe(200)
    expect(mockStreamText).toHaveBeenCalledTimes(1)
  })
})
