import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getOffers } from '@/actions/panel/offers'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { OffersListView } from '@/components/panel/oferty/OffersListView'
import { AdminDisclaimer } from '@/components/panel/AdminDisclaimer'

export const metadata = { title: 'Zarządzaj ofertami' }

export default async function OffertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ strona?: string; filtr?: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
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

  const page = Math.max(1, Number(resolvedSearchParams.strona) || 1)
  const statusFilter = resolvedSearchParams.filtr as 'published' | 'draft' | undefined

  const [offersResult, bgUrl] = await Promise.all([
    getOffers(user.id, page, 10, statusFilter === 'published' || statusFilter === 'draft' ? statusFilter : undefined),
    getHeaderBackgroundUrl(),
  ])

  const offers = offersResult.success ? offersResult.data : []
  const pagination = offersResult.success && 'pagination' in offersResult ? offersResult.pagination : undefined

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Twoje oferty"
        description="Zarządzaj swoimi ogłoszeniami"
        breadcrumbs={[{ label: 'Oferty' }]}
        lang={lang}
        backgroundImageUrl={bgUrl}
      />
      <AdminDisclaimer role={user.role ?? ''} variant="offers" />
      <OffersListView
        offers={offers}
        maxOffers={user.maxOffers ?? 1}
        lang={lang}
        pagination={pagination}
        currentFilter={statusFilter}
      />
    </div>
  )
}
