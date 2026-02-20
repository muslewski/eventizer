import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { Offer, Page } from '@/payload-types'

/**
 * When an offer is updated (and published), find all pages that feature it
 * in a FeaturedOffers block and revalidate those page paths so the frontend
 * reflects the latest offer data (image, link, title, etc.).
 */
export const revalidateFeaturedOffers: CollectionAfterChangeHook<Offer> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  // Only revalidate when the offer is published
  if (doc._status !== 'published') return doc

  await revalidatePagesWithOffer(payload, doc.id)

  return doc
}

export const revalidateFeaturedOffersOnDelete: CollectionAfterDeleteHook<Offer> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  await revalidatePagesWithOffer(payload, doc.id)

  return doc
}

async function revalidatePagesWithOffer(
  payload: Parameters<CollectionAfterChangeHook>[0]['req']['payload'],
  offerId: number,
) {
  // Fetch all published pages (typically few) to inspect their layout blocks
  const pages = await payload.find({
    collection: 'pages',
    limit: 100,
    depth: 0,
    pagination: false,
    where: {
      _status: { equals: 'published' },
    },
  })

  for (const page of pages.docs) {
    const hasFeaturedOffer = (page as Page).layout?.some(
      (block) =>
        block.blockType === 'featuredOffers' &&
        block.offers?.some((o) => {
          const id = typeof o === 'object' ? o.id : o
          return id === offerId
        }),
    )

    if (hasFeaturedOffer) {
      const path = page.slug === 'home' ? '/' : `/${page.slug}`
      payload.logger.info(
        `Revalidating page "${page.slug}" because featured offer ${offerId} was updated`,
      )
      revalidatePath(path)
    }
  }
}
