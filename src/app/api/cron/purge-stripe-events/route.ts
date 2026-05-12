import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 60

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const old = await payload.find({
    collection: 'processed-stripe-events',
    where: { processedAt: { less_than: cutoff.toISOString() } },
    limit: 1000,
    depth: 0,
  })

  let deleted = 0
  for (const doc of old.docs) {
    await payload.delete({ collection: 'processed-stripe-events', id: doc.id, overrideAccess: true })
    deleted++
  }

  return NextResponse.json({ deleted, cutoff: cutoff.toISOString() })
}
