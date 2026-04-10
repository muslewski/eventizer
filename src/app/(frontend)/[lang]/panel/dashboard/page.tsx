import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getDashboardStats } from '@/actions/panel/dashboard'
import { ServiceProviderDashboard } from '@/components/panel/dashboard/ServiceProviderDashboard'
import { ClientDashboard } from '@/components/panel/dashboard/ClientDashboard'

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
  const user = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  })

  if (!user) {
    return null
  }

  const stats = await getDashboardStats(user.id, user.role ?? 'client')

  if (!stats.success) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-bebas text-3xl tracking-wide">Dashboard</h1>
        <p className="text-muted-foreground">Nie udało się załadować danych. Spróbuj ponownie później.</p>
      </div>
    )
  }

  const role = user.role ?? 'client'

  if (role === 'service-provider' || role === 'admin' || role === 'moderator') {
    return <ServiceProviderDashboard stats={stats.data as any} user={user} lang={lang} />
  }

  return <ClientDashboard stats={stats.data as any} user={user} lang={lang} />
}
