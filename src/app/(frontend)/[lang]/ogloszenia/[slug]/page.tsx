import { getPayload, Locale } from 'payload'
import configPromise from '@payload-config'

type Args = {
  params: Promise<{
    slug?: string
    lang: Locale
  }>
}

export default async function Page({ params }: Args) {
  const { slug, lang } = await params

  if (!slug) {
    return null
  }

  const offerPage = await queryOfferPageBySlug({
    slug,
    lang,
  })

  return (
    <div>
      {offerPage ? (
        <div className="h-screen flex items-center">
          <h1>{offerPage.title}</h1>
        </div>
      ) : (
        <p>Offer not found.</p>
      )}
    </div>
  )
}

const queryOfferPageBySlug = async ({ slug, lang }: { slug: string; lang: Locale }) => {
  // is enabled
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    collection: 'offers',
    // draft,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
      ],
    },
  })

  return result.docs?.[0] || null
}
