import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getOffer } from '@/actions/panel/offers'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { OfferWizardForm } from '@/components/panel/wizard/OfferWizardForm'

export default async function EdytujOfertePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  })

  if (!user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  if (user.role === 'client') {
    redirect(`/${lang}/panel/dashboard`)
  }

  const offerResult = await getOffer(slug, user.id)

  if (!offerResult.success) {
    notFound()
  }

  const offer = offerResult.data

  const [categoriesResult, bgUrl] = await Promise.all([
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
    getHeaderBackgroundUrl(),
  ])

  return (
    <OfferWizardForm
      mode="edit"
      initialData={offer}
      offerId={offer.id}
      categories={categoriesResult.docs}
      lang={lang}
      backgroundImageUrl={bgUrl}
      breadcrumbs={[
        { label: 'Oferty', href: '/panel/oferty' },
        { label: offer.title, href: `/panel/oferty/${slug}` },
        { label: 'Edytuj' },
      ]}
    />
  )
}
