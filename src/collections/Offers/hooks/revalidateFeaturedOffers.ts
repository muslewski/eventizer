import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { Offer } from '@/payload-types'

/**
 * When a published offer changes, revalidate all pages so FeaturedOffers blocks
 * (and any other blocks referencing offers) reflect the latest data.
 *
 * We use revalidatePath('/', 'layout') which marks ALL cached pages as stale.
 * This is fine because:
 * - Offers change infrequently (manual user action)
 * - Pages are re-generated lazily on next request (no upfront cost)
 * - Targeted path matching is unreliable with locale-based routing ([lang]/[slug])
 */
export const revalidateFeaturedOffers: CollectionAfterChangeHook<Offer> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  // Only revalidate when the offer is published
  if (doc._status !== 'published') return doc

  payload.logger.info(`Revalidating all pages — published offer ${doc.id} ("${doc.title}") was updated`)
  revalidatePath('/', 'layout')

  return doc
}

export const revalidateFeaturedOffersOnDelete: CollectionAfterDeleteHook<Offer> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(`Revalidating all pages — offer ${doc.id} was deleted`)
  revalidatePath('/', 'layout')

  return doc
}
