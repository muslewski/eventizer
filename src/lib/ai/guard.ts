import { headers } from 'next/headers'
import { auth } from '@/auth/auth'

/**
 * Best-effort daily cap per user. The counter is per warm serverless
 * instance, so it bounds abuse rather than enforcing an exact quota —
 * the durable, cross-instance limit is tracked as tech-debt
 * (eventizer-mind/tech-debt/ai-rate-limit-not-durable.md).
 */
const DAILY_LIMIT = 50
const DAY_MS = 24 * 60 * 60 * 1000
const counters = new Map<string, { count: number; resetAt: number }>()

export async function guardAiGeneration(): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const key = String(session.user.id)
  const now = Date.now()
  const entry = counters.get(key)

  if (!entry || entry.resetAt < now) {
    counters.set(key, { count: 1, resetAt: now + DAY_MS })
  } else if (entry.count >= DAILY_LIMIT) {
    return {
      ok: false,
      response: Response.json(
        { error: 'Dzienny limit generowania AI został osiągnięty. Spróbuj jutro.' },
        { status: 429 },
      ),
    }
  } else {
    entry.count++
  }

  return { ok: true, userId: key }
}
