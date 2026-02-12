import { getPayload, Locale } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { OfferHero, OfferDetails, ContactInfo } from './components'
import type { Metadata } from 'next'
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

  return generateMeta({
    doc: {
      ...offer,
      slug: offer.link,
    } as any,
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

  return (
    <article>
      <LivePreviewOffer initialData={offer} initialCategoryIconUrl={categoryIconUrl} />
    </article>
  )
}

const queryOfferPageBySlug = async ({ slug, lang }: { slug: string; lang: Locale }) => {
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
}
