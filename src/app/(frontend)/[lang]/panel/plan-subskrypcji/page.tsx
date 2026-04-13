import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { SubscriptionManager } from '@/components/panel/plan-subskrypcji/SubscriptionManager'

export default async function PlanSubskrypcjiPage({
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

  const [subscription, categoriesResult] = await Promise.all([
    getCurrentSubscriptionDetails(user.id),
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
  ])

  const betaMode = process.env.BETA_MODE === 'true'

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Plan subskrypcji"
        description="Zarządzaj swoim planem i kategorią usług"
        breadcrumbs={[{ label: 'Plan subskrypcji' }]}
        lang={lang}
      />
      <SubscriptionManager
        user={user}
        subscription={subscription}
        categories={categoriesResult.docs as any}
        lang={lang}
        showBetaOption={betaMode}
      />
    </div>
  )
}
