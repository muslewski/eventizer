import type { Media, Offer } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

/** Carousel-ready partner shape consumed by PartnersClient. */
export type ResolvedPartner = {
  name: string
  tagline?: string | null
  quote?: string | null
  logo?: (number | Media) | null
  accentColor?: string | null
  /** Resolved /ogloszenia/<slug> URL when the partner's offer is set + published. */
  offerHref: string | null
  /** Trimmed external website URL, or null when not set. */
  externalHref: string | null
}

/** Raw partner shape shared by the inline block array and the partners collection. */
export type RawPartner = {
  name: string
  tagline?: string | null
  quote?: string | null
  logo?: (number | Media) | null
  accentColor?: string | null
  offer?: (number | Offer) | null
  externalUrl?: string | null
}

/**
 * Pure mapper: given a partner and a map of published-offer link slugs by id,
 * produce the carousel-ready ResolvedPartner. No I/O — unit-testable.
 */
export function toResolvedPartner(
  p: RawPartner,
  offerLinkById: Map<number, string>,
): ResolvedPartner {
  let offerHref: string | null = null
  if (p.offer != null) {
    const offerId = typeof p.offer === 'object' ? p.offer.id : p.offer
    const link = offerLinkById.get(offerId)
    if (link) offerHref = `/ogloszenia/${link}`
  }
  const externalHref = p.externalUrl?.trim() ? p.externalUrl.trim() : null
  return {
    name: p.name,
    tagline: p.tagline ?? null,
    quote: p.quote ?? null,
    logo: p.logo ?? null,
    accentColor: p.accentColor ?? null,
    offerHref,
    externalHref,
  }
}

/**
 * Re-fetch referenced offers fresh (published only) so links stay accurate even
 * on statically-cached pages, then map every partner to a ResolvedPartner.
 * (Same freshness strategy as FeaturedOffers/Component.tsx.)
 */
export async function resolvePartners(partners: RawPartner[]): Promise<ResolvedPartner[]> {
  const offerIds = partners
    .map((p) => (p.offer == null ? null : typeof p.offer === 'object' ? p.offer.id : p.offer))
    .filter((id): id is number => typeof id === 'number')

  const offerLinkById = new Map<number, string>()
  if (offerIds.length > 0) {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'offers',
      where: { id: { in: offerIds }, _status: { equals: 'published' } },
      limit: offerIds.length,
      depth: 0,
      select: { link: true },
    })
    for (const d of docs) {
      if (d.link) offerLinkById.set(d.id, d.link as string)
    }
  }

  return partners.map((p) => toResolvedPartner(p, offerLinkById))
}
