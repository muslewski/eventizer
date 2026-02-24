import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { Offer } from '@/payload-types'

/**
 * Revalidate all pages when an offer changes so that every block depending on
 * offer data (FeaturedOffers, OffersMap, etc.) reflects the latest state.
 *
 * We use revalidatePath('/', 'layout') which marks ALL cached pages as stale.
 * This is fine because:
 * - Offers change infrequently (manual user action)
 * - Pages are re-generated lazily on next request (no upfront cost)
 * - Targeted path matching is unreliable with locale-based routing ([lang]/[slug])
 *
 * We revalidate when:
 * - A published offer is updated (image, link, location, title, etc.)
 * - An offer is newly published
 * - A previously published offer is unpublished / reverted to draft
 */
export const revalidateOffer: CollectionAfterChangeHook<Offer> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  const isPublished = doc._status === 'published'
  const wasPublished = previousDoc?._status === 'published'

  // Revalidate if the offer is currently published OR was previously published
  // (covers: update while published, newly published, and unpublished/reverted)
  if (!isPublished && !wasPublished) return doc

  payload.logger.info(
    `Revalidating all pages — offer ${doc.id} ("${doc.title}") changed [${wasPublished ? 'published' : 'draft'} → ${isPublished ? 'published' : 'draft'}]`,
  )
  revalidatePath('/', 'layout')

  return doc
}

export const revalidateOfferOnDelete: CollectionAfterDeleteHook<Offer> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(`Revalidating all pages — offer ${doc.id} was deleted`)
  revalidatePath('/', 'layout')

  return doc
}
