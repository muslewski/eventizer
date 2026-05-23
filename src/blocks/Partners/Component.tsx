import { PartnersClient } from '@/blocks/Partners/Component.client'
import type { Offer, PartnersBlock as PartnersBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type ResolvedPartner = NonNullable<PartnersBlockProps['partners']>[number] & {
  href: string | null
  isExternal: boolean
}

export const PartnersBlock: React.FC<
  PartnersBlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ badge, heading, description, rotationSeconds, partners, className }) => {
  // Collect IDs of offers referenced by partners (linkType === 'offer')
  const offerIds = (partners ?? [])
    .map((p) => {
      if (p.linkType !== 'offer' || !p.offer) return null
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
    let href: string | null = null
    let isExternal = false

    if (p.linkType === 'offer' && p.offer) {
      const offerId = typeof p.offer === 'object' ? p.offer.id : p.offer
      const offer = offerMap.get(offerId)
      if (offer?.link) href = `/ogloszenia/${offer.link}`
    } else if (p.linkType === 'external' && p.externalUrl) {
      href = p.externalUrl
      isExternal = true
    }

    return { ...p, href, isExternal }
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
