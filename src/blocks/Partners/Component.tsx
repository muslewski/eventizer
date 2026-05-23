import { PartnersClient } from '@/blocks/Partners/Component.client'
import type { Offer, PartnersBlock as PartnersBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type ResolvedPartner = NonNullable<PartnersBlockProps['partners']>[number] & {
  /** Resolved /ogloszenia/<slug> URL when the partner's offer relationship is set + published. */
  offerHref: string | null
  /** Trimmed externalUrl from config, or null when not set. */
  externalHref: string | null
}

export const PartnersBlock: React.FC<
  PartnersBlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ badge, heading, description, rotationSeconds, partners, className }) => {
  // Collect IDs of offers referenced by partners (offer relationship can be set
  // independently of externalUrl now — both, either, or neither may be present).
  const offerIds = (partners ?? [])
    .map((p) => {
      if (!p.offer) return null
      return typeof p.offer === 'object' ? p.offer.id : p.offer
    })
    .filter((id): id is number => typeof id === 'number')

  // Re-fetch offers fresh from the database so the link stays accurate even
  // when the page is statically cached (same pattern as FeaturedOffers).
  let offerMap = new Map<number, Pick<Offer, 'id' | 'link'>>()
  if (offerIds.length > 0) {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'offers',
      where: {
        id: { in: offerIds },
        _status: { equals: 'published' },
      },
      limit: offerIds.length,
      depth: 0,
      select: { link: true },
    })
    offerMap = new Map(docs.map((d) => [d.id, d]))
  }

  const resolvedPartners: ResolvedPartner[] = (partners ?? []).map((p) => {
    let offerHref: string | null = null
    if (p.offer) {
      const offerId = typeof p.offer === 'object' ? p.offer.id : p.offer
      const offer = offerMap.get(offerId)
      if (offer?.link) offerHref = `/ogloszenia/${offer.link}`
    }
    const externalHref = p.externalUrl?.trim() ? p.externalUrl.trim() : null
    return { ...p, offerHref, externalHref }
  })

  return (
    <PartnersClient
      badge={badge}
      heading={heading}
      description={description ?? undefined}
      rotationSeconds={rotationSeconds ?? undefined}
      partners={resolvedPartners}
      className={className}
    />
  )
}
