import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getHelpTickets } from '@/actions/panel/help'
import { PanelBreadcrumb } from '@/components/panel/PanelBreadcrumb'
import { PomocTable } from '@/components/panel/pomoc/PomocTable'
import { NewTicketDialog } from '@/components/panel/pomoc/NewTicketDialog'

export default async function PomocPage({
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

  const ticketsResult = await getHelpTickets(user.id)
  const tickets = ticketsResult.success ? ticketsResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <PanelBreadcrumb segments={[{ label: 'Pomoc' }]} lang={lang} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-bebas text-3xl tracking-wide">Pomoc</h1>
        <NewTicketDialog userEmail={user.email} />
      </div>
      <PomocTable tickets={tickets} />
    </div>
  )
}
