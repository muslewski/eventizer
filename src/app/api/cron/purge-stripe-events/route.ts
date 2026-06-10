import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 60

export async function GET(request: Request) {
  // Fail closed: without a configured secret, "Bearer undefined" would match.
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Single bulk delete instead of a per-doc loop — the previous version could
  // only clear ~600 rows of sequential round-trips inside maxDuration.
  const result = await payload.delete({
    collection: 'processed-stripe-events',
    where: { processedAt: { less_than: cutoff.toISOString() } },
    depth: 0,
    overrideAccess: true,
  })

  return NextResponse.json({ deleted: result.docs.length, cutoff: cutoff.toISOString() })
}
