import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getOffer } from '@/actions/panel/offers'
import { PanelBreadcrumb } from '@/components/panel/PanelBreadcrumb'
import { OfferDetailView } from '@/components/panel/oferty/OfferDetailView'

export default async function OfferDetailPage({
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

  return (
    <div className="flex flex-col gap-6">
      <PanelBreadcrumb
        segments={[
          { label: 'Oferty', href: '/panel/oferty' },
          { label: offer.title },
        ]}
        lang={lang}
      />
      <OfferDetailView offer={offer} lang={lang} />
    </div>
  )
}
