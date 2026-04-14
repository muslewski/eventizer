import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { AccountSettings } from '@/components/panel/konto/AccountSettings'

export const metadata = { title: 'Konto' }

export default async function KontoPage({
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

  const isProvider =
    user.role === 'service-provider' ||
    user.role === 'admin' ||
    user.role === 'moderator'

  const [subscription, bgUrl] = await Promise.all([
    isProvider ? getCurrentSubscriptionDetails(user.id) : Promise.resolve(undefined),
    getHeaderBackgroundUrl(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Konto"
        description="Ustawienia profilu i konta"
        breadcrumbs={[{ label: 'Konto' }]}
        lang={lang}
        backgroundImageUrl={bgUrl}
      />
      <AccountSettings user={user} subscription={subscription} lang={lang} />
    </div>
  )
}
