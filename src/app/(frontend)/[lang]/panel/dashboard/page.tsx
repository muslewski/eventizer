import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getDashboardStats } from '@/actions/panel/dashboard'
import { ServiceProviderDashboard } from '@/components/panel/dashboard/ServiceProviderDashboard'
import { ClientDashboard } from '@/components/panel/dashboard/ClientDashboard'
import { DashboardHero } from '@/components/panel/dashboard/DashboardHero'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return null
  }

  const payload = await getPayload({ config })

  const [user, backgroundResult] = await Promise.all([
    payload.findByID({
      collection: 'users',
      id: Number(session.user.id),
      depth: 0,
    }),
    payload.find({
      collection: 'media',
      where: { filename: { equals: '404-background-compressed.jpeg' } },
      limit: 1,
    }),
  ])

  if (!user) {
    return null
  }

  const backgroundImageUrl = backgroundResult.docs[0]?.url ?? null
  const stats = await getDashboardStats(user.id, user.role ?? 'client')

  const role = user.role ?? 'client'

  return (
    <div className="flex flex-col gap-6">
      <DashboardHero
        userName={user.name ?? ''}
        backgroundImageUrl={backgroundImageUrl}
      />

      {!stats.success ? (
        <p className="text-muted-foreground">Nie udało się załadować danych. Spróbuj ponownie później.</p>
      ) : role === 'service-provider' || role === 'admin' || role === 'moderator' ? (
        <ServiceProviderDashboard stats={stats.data as any} user={user} lang={lang} />
      ) : (
        <ClientDashboard stats={stats.data as any} user={user} lang={lang} />
      )}
    </div>
  )
}
