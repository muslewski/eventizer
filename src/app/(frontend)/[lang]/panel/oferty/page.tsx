import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getOffers } from '@/actions/panel/offers'
import { PanelBreadcrumb } from '@/components/panel/PanelBreadcrumb'
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

  const offersResult = await getOffers(user.id)
  const offers = offersResult.success ? offersResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <PanelBreadcrumb segments={[{ label: 'Oferty' }]} lang={lang} />
      <h1 className="font-bebas text-3xl tracking-wide">Twoje oferty</h1>
      <OffersListView
        offers={offers}
        maxOffers={user.maxOffers ?? 1}
        lang={lang}
      />
    </div>
  )
}
