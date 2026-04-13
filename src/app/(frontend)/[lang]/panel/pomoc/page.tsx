import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getHelpTickets } from '@/actions/panel/help'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
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

  const [ticketsResult, bgUrl] = await Promise.all([
    getHelpTickets(user.id),
    getHeaderBackgroundUrl(),
  ])
  const tickets = ticketsResult.success ? ticketsResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Pomoc"
        description="Twoje zgłoszenia i centrum pomocy"
        breadcrumbs={[{ label: 'Pomoc' }]}
        lang={lang}
        action={<NewTicketDialog userEmail={user.email} />}
        backgroundImageUrl={bgUrl}
      />
      <PomocTable tickets={tickets} />
    </div>
  )
}
