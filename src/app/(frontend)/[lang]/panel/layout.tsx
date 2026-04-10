import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { PanelShell } from '@/components/panel/PanelShell'

export default async function PanelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  const payload = await getPayload({ config })
  const payloadUser = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  })

  if (!payloadUser) {
    redirect(`/${lang}/auth/sign-in`)
  }

  return (
    <PanelShell user={payloadUser} lang={lang}>
      {children}
    </PanelShell>
  )
}
