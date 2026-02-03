import { getPayload, Locale } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { OfferHero, OfferDetails, ContactInfo } from './components'
import type { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'

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

  return (
    <article>
      {/* Hero Section with background effects */}
      <OfferHero offer={offer} />

      <div className="flex flex-col gap-8 lg:gap-12 w-full">
        {/* Main Content Section */}
        <OfferDetails offer={offer} />

        {/* Contact & Social Media Section */}
        <ContactInfo offer={offer} />
      </div>
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
