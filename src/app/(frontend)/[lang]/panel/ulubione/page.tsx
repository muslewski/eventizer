import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getFavorites } from '@/actions/panel/favorites'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { FavoritesGrid } from '@/components/panel/ulubione/FavoritesGrid'

export default async function UlubiionePage({
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

  const favoritesResult = await getFavorites(user.id)
  const offers = favoritesResult.success ? favoritesResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Ulubione"
        description="Twoje zapisane oferty"
        breadcrumbs={[{ label: 'Ulubione' }]}
        lang={lang}
      />
      <FavoritesGrid offers={offers} lang={lang} />
    </div>
  )
}
