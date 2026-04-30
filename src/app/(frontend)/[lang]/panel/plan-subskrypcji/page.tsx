import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { getPlanPriceSummary, type PlanPriceSummary } from '@/actions/stripe/products/getPlanPriceSummary'
import { PanelPageHeader } from '@/components/panel/PanelPageHeader'
import { SubscriptionManager } from '@/components/panel/plan-subskrypcji/SubscriptionManager'
import { AdminDisclaimer } from '@/components/panel/AdminDisclaimer'
import type { SubscriptionPlan } from '@/payload-types'

export const metadata = { title: 'Plan subskrypcji' }

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

  const [subscription, categoriesResult, bgUrl, multiPlansResult] = await Promise.all([
    getCurrentSubscriptionDetails(user.id),
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
    getHeaderBackgroundUrl(),
    payload.find({
      collection: 'subscription-plans',
      where: { maxOffers: { greater_than: 1 } },
      sort: 'level',
      limit: 10,
    }),
  ])

  const multiPlans = multiPlansResult.docs as SubscriptionPlan[]

  // Fetch price summaries for all multi-class plans in parallel
  const planSummaries: Record<string, PlanPriceSummary> = {}
  await Promise.all(
    multiPlans
      .filter((p) => p.stripeID)
      .map(async (p) => {
        planSummaries[p.id] = await getPlanPriceSummary(p.stripeID as string)
      }),
  )

  const betaMode = process.env.BETA_MODE === 'true'

  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader
        title="Plan subskrypcji"
        description="Zarządzaj swoim planem i kategorią usług"
        breadcrumbs={[{ label: 'Plan subskrypcji' }]}
        lang={lang}
        backgroundImageUrl={bgUrl}
      />
      <AdminDisclaimer role={user.role ?? ''} variant="subscription" />
      <SubscriptionManager
        user={user}
        subscription={subscription}
        categories={categoriesResult.docs as any}
        multiPlans={multiPlans}
        planSummaries={planSummaries}
        lang={lang}
        showBetaOption={betaMode}
      />
    </div>
  )
}
