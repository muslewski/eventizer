import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getFavorites } from '@/actions/panel/favorites'
import { PanelBreadcrumb } from '@/components/panel/PanelBreadcrumb'
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
      <PanelBreadcrumb segments={[{ label: 'Ulubione' }]} lang={lang} />
      <h1 className="font-bebas text-3xl tracking-wide">Ulubione</h1>
      <FavoritesGrid offers={offers} lang={lang} />
    </div>
  )
}
