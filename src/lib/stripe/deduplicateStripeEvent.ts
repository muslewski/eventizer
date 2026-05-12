import type { Payload } from 'payload'

export async function deduplicateStripeEvent(payload: Payload, eventId: string): Promise<boolean> {
  const existing = await payload.find({
    collection: 'processed-stripe-events',
    where: { eventId: { equals: eventId } },
    limit: 1,
    depth: 0,
  })
  return existing.totalDocs === 0
}
