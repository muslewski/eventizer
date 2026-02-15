import { getPayload } from 'payload'
import config from '@payload-config'
import { OffersMapClient } from '@/blocks/OffersMap/Component.client'
import type { OffersMapBlock as OffersMapProps } from '@/payload-types'
import { resolveCategoryIconUrl } from '@/actions/resolveCategoryIconUrl'

export interface OfferPin {
  id: number
  lat: number
  lng: number
  city: string | null
  title: string
  link: string
  shortDescription: string | null
  mainImageUrl: string | null
  categoryName: string | null
  categoryIconUrl: string | null
  price: number | null
  priceFrom: number | null
  priceTo: number | null
  hasPriceRange: boolean
}

export const OffersMapBlock: React.FC<
  OffersMapProps & {
    id?: string | number
    className?: string
  }
> = async ({ heading, description, className }) => {
  const payload = await getPayload({ config })

  // Fetch published offers with location, plus data needed for info cards
  const { docs, totalDocs } = await payload.find({
    collection: 'offers',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { 'location.lat': { exists: true } },
        { 'location.lng': { exists: true } },
      ],
    },
    select: {
      title: true,
      link: true,
      shortDescription: true,
      mainImage: true,
      category: true,
      categoryName: true,
      price: true,
      priceFrom: true,
      priceTo: true,
      hasPriceRange: true,
      location: {
        lat: true,
        lng: true,
        city: true,
      },
    },
    limit: 0,
    depth: 1, // Populate mainImage to get URL
    pagination: false,
  })

  // Resolve category icons in parallel (deduplicate category paths first)
  const uniqueCategories = [...new Set(docs.map((d) => d.category).filter(Boolean))] as string[]
  const categoryIconMap = new Map<string, string | null>()
  await Promise.all(
    uniqueCategories.map(async (cat) => {
      const url = await resolveCategoryIconUrl(cat)
      categoryIconMap.set(cat, url)
    }),
  )

  const pins: OfferPin[] = docs
    .filter((doc) => doc.location?.lat != null && doc.location?.lng != null)
    .map((doc) => {
      const mainImage = doc.mainImage
      const mainImageUrl =
        mainImage && typeof mainImage === 'object' && 'url' in mainImage
          ? (mainImage.url ?? null)
          : null
      return {
        id: doc.id,
        lat: doc.location!.lat!,
        lng: doc.location!.lng!,
        city: doc.location?.city ?? null,
        title: doc.title,
        link: doc.link ?? '',
        shortDescription: doc.shortDescription ?? null,
        mainImageUrl,
        categoryName: doc.categoryName ?? null,
        categoryIconUrl: doc.category ? (categoryIconMap.get(doc.category) ?? null) : null,
        price: doc.price ?? null,
        priceFrom: doc.priceFrom ?? null,
        priceTo: doc.priceTo ?? null,
        hasPriceRange: doc.hasPriceRange ?? false,
      }
    })

  return (
    <OffersMapClient
      heading={heading}
      description={description}
      pins={pins}
      totalOffers={totalDocs}
      className={className}
    />
  )
}
