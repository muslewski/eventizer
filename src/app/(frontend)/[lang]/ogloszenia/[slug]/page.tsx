import { getPayload, Locale } from 'payload'
import { cache } from 'react'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { OfferHero, OfferDetails, ContactInfo } from './components'
import type { Metadata } from 'next'
import type { EventType, Offer } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { LivePreviewOffer } from './LivePreviewOffer'
import { resolveCategoryIconUrl } from '@/actions/resolveCategoryIconUrl'

type Args = {
  params: Promise<{
    slug?: string
    lang: Locale
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, lang } = await params

  if (!slug) {
    return {}
  }

  const offer = await queryOfferPageBySlug({ slug, lang })

  if (!offer) {
    return {}
  }

  // Fall back to offer fields if SEO meta fields are not set
  const docWithFallbackImage = {
    ...offer,
    slug: offer.link,
    meta: {
      ...offer.meta,
      title: offer.meta?.title ?? offer.title ?? null,
      description: offer.meta?.description ?? offer.shortDescription ?? null,
      image: offer.meta?.image ?? offer.mainImage ?? null,
    },
  }

  return generateMeta({
    doc: docWithFallbackImage as any,
    // Offers are mounted under /ogloszenia/<link>; offer.link is just the slug,
    // so build the full canonical here (otherwise og:url would be a 404 /<link>).
    url: `/ogloszenia/${offer.link}`,
  })
}

export default async function OfferPage({ params }: Args) {
  const { slug, lang } = await params

  if (!slug) {
    notFound()
  }

  const offer = await queryOfferPageBySlug({
    slug,
    lang,
  })

  if (!offer) {
    notFound()
  }

  const categoryIconUrl = offer.category ? await resolveCategoryIconUrl(offer.category) : null

  // Active event types power the "applies to all" rotation in the offer's
  // info card (when the offer itself has no specific types selected).
  const allEventTypes = await queryActiveEventTypes()

  // Surface this provider's other published offers below the contact form
  // so visitors who don't reach out here have somewhere natural to keep
  // browsing within the same seller's catalogue.
  const providerUserId =
    typeof offer.user === 'object' && offer.user !== null ? offer.user.id : offer.user
  const otherOffersByProvider =
    typeof providerUserId === 'number'
      ? await queryOtherOffersByProvider({
          userId: providerUserId,
          excludeOfferId: offer.id,
        })
      : []

  return (
    <article>
      <LivePreviewOffer
        initialData={offer}
        initialCategoryIconUrl={categoryIconUrl}
        otherOffersByProvider={otherOffersByProvider}
        allEventTypes={allEventTypes}
      />
    </article>
  )
}

const queryActiveEventTypes = cache(async (): Promise<EventType[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'event-types',
    where: { isActive: { equals: true } },
    sort: '_order',
    depth: 1,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })
  return result.docs as EventType[]
})

const queryOfferPageBySlug = cache(async ({ slug, lang }: { slug: string; lang: Locale }) => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    collection: 'offers',
    limit: 1,
    overrideAccess: true,
    pagination: false,
    depth: 2, // Ensure relationships are populated
    where: {
      and: [
        {
          link: {
            equals: slug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  return result.docs?.[0] || null
})

/**
 * Other published offers by the same service provider, excluding the one
 * currently being viewed. Wrapped in React.cache so the same provider's
 * lookup dedupes across generateMetadata + OfferPage in a single render.
 * depth: 1 is enough — the carousel only reads mainImage + a few text
 * fields off each offer.
 */
const queryOtherOffersByProvider = cache(
  async ({
    userId,
    excludeOfferId,
  }: {
    userId: number
    excludeOfferId: number
  }): Promise<Offer[]> => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'offers',
      where: {
        and: [
          { user: { equals: userId } },
          { id: { not_equals: excludeOfferId } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 6,
      depth: 1,
      pagination: false,
    })
    return result.docs as Offer[]
  },
)
