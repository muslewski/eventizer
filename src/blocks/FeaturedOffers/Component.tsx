import { FeaturedOffersClient } from '@/blocks/FeaturedOffers/Component.client'
import { Offer, type FeaturedOffersBlock as FeaturedOffersProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const FeaturedOffersBlock: React.FC<
  FeaturedOffersProps & {
    id?: string | number
    className?: string
  }
> = async ({ heading, description, offers, className }) => {
  // Extract offer IDs from the relationship (may be expanded or just IDs)
  const offerIds = offers
    .map((o) => (typeof o === 'object' ? o.id : o))
    .filter((id): id is number => typeof id === 'number')

  if (offerIds.length === 0) return null

  // Re-fetch offers fresh from the database so we always have the latest
  // data (image, link, title, etc.) even when the page is statically cached.
  const payload = await getPayload({ config: configPromise })
  const { docs: freshOffers } = await payload.find({
    collection: 'offers',
    where: {
      id: { in: offerIds },
      _status: { equals: 'published' },
    },
    limit: offerIds.length,
    depth: 1,
  })

  // Preserve the original ordering from the block config
  const orderedOffers = offerIds
    .map((id) => freshOffers.find((o) => o.id === id))
    .filter((o): o is Offer => o != null)

  if (orderedOffers.length === 0) return null

  return (
    <FeaturedOffersClient
      heading={heading}
      description={description}
      offers={orderedOffers}
      className={className}
    />
  )
}
