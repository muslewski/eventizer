import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getOffers } from '@/actions/panel/offers'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { OffersListView } from '@/components/panel/oferty/OffersListView'

export default async function OffertyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
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

  const [offersResult, bgUrl] = await Promise.all([
    getOffers(user.id),
    getHeaderBackgroundUrl(),
  ])
  const offers = offersResult.success ? offersResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Twoje oferty"
        description="Zarządzaj swoimi ogłoszeniami"
        breadcrumbs={[{ label: 'Oferty' }]}
        lang={lang}
        backgroundImageUrl={bgUrl}
      />
      <OffersListView
        offers={offers}
        maxOffers={user.maxOffers ?? 1}
        lang={lang}
      />
    </div>
  )
}
