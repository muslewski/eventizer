'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  MoreHorizontalIcon,
  QuoteIcon,
  RefreshCwIcon,
  RepeatIcon,
  SettingsIcon,
  SparklesIcon,
  TagIcon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { SubscriptionWizard } from './SubscriptionWizard'
import {
  getDisplayPlanName,
  resolveCurrentPlanByMaxOffers,
} from './lib/getDisplayPlanName'
import { getPlanInfo } from './lib/getPlanInfo'
import { createBillingPortalSession } from '@/actions/stripe/manageSubscription'
import type { User, ServiceCategory, SubscriptionPlan } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface SubscriptionManagerProps {
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  plans: SubscriptionPlan[]
  lang: string
  showBetaOption: boolean
}

type View =
  | 'status'
  | 'wizard-onboarding'
  | 'wizard-change-plan'
  | 'wizard-change-category'

export function SubscriptionManager({
  user,
  subscription,
  categories,
  plans,
  lang,
  showBetaOption,
}: SubscriptionManagerProps) {
  const [view, setView] = React.useState<View>(() =>
    user.role === 'service-provider' ? 'status' : 'wizard-onboarding',
  )
  const [isPending, startTransition] = React.useTransition()

  const isExpired = user.role === 'service-provider' && !subscription.hasSubscription
  const isActive = user.role === 'service-provider' && subscription.hasSubscription
  // Resolve the current plan from local user state (user.maxOffers) instead of
  // Stripe's stale read. changePlan writes maxOffers synchronously; Stripe's
  // subscriptions.list has a brief read-after-write inconsistency window.
  const currentPlan =
    resolveCurrentPlanByMaxOffers(user.maxOffers, plans) ?? subscription.currentPlan
  const isSinglePlan = (currentPlan?.maxOffers ?? 1) === 1
  const isBeta = !!subscription.isBetaUser
  const planInfo = getPlanInfo(currentPlan, isBeta)
  const PlanIcon = planInfo.icon
  const planTitle = isBeta
    ? 'Plan Beta'
    : getDisplayPlanName(currentPlan) || 'Aktywna subskrypcja'

  if (view === 'wizard-onboarding') {
    return (
      <SubscriptionWizard
        entry="onboarding"
        user={user}
        subscription={subscription}
        categories={categories}
        plans={plans}
        lang={lang}
        showBetaOption={showBetaOption}
        onExit={() => setView('status')}
      />
    )
  }
  if (view === 'wizard-change-plan') {
    return (
      <SubscriptionWizard
        entry="change-plan"
        user={user}
        subscription={subscription}
        categories={categories}
        plans={plans}
        lang={lang}
        showBetaOption={showBetaOption}
        onExit={() => setView('status')}
      />
    )
  }
  if (view === 'wizard-change-category') {
    return (
      <SubscriptionWizard
        entry="change-category"
        user={user}
        subscription={subscription}
        categories={categories}
        plans={plans}
        lang={lang}
        showBetaOption={showBetaOption}
        onExit={() => setView('status')}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {isExpired && (
        <>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Subskrypcja wygasła</AlertTitle>
            <AlertDescription>
              Twoja subskrypcja wygasła. Twoje oferty zostały wycofane z publikacji.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setView('wizard-onboarding')} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" /> Odnów subskrypcję
          </Button>
        </>
      )}
      {isActive && (
        <div className="flex flex-col gap-5 rounded-xl border border-border/20 bg-background p-5 sm:p-6">
          {/* Header: icon square + title/tagline + status badges */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              {/* Accent-tinted icon square — matches wizard cards */}
              <div
                aria-hidden="true"
                className="flex size-11 sm:size-12 flex-shrink-0 items-center justify-center rounded-lg border bg-accent/[0.08] border-accent/20 text-accent/80"
              >
                <PlanIcon className="size-5 sm:size-6" strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide leading-none">
                  {planTitle}
                </h2>
                <div className="flex items-start gap-1.5">
                  <QuoteIcon
                    aria-hidden="true"
                    className="size-3 mt-1 flex-shrink-0 text-accent/60"
                  />
                  <span className="text-sm italic text-muted-foreground leading-snug">
                    {planInfo.tagline}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isBeta && (
                <Badge
                  variant="outline"
                  className="border-accent/40 bg-accent/10 text-accent gap-1"
                >
                  <SparklesIcon className="size-3" />
                  Beta
                </Badge>
              )}
              <Badge
                variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}
              >
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40" aria-hidden="true" />

          {/* Short benefit reminder list */}
          <ul className="flex flex-col gap-2 text-sm">
            {planInfo.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-5 mt-px flex-shrink-0 items-center justify-center rounded-full bg-accent/[0.08]"
                >
                  <CheckIcon className="size-3 text-accent/70" strokeWidth={3} />
                </span>
                <span className="text-foreground/90 leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>

          {/* Divider before meta info */}
          {(user.serviceCategory || subscription.currentPeriodEnd) && (
            <div className="h-px bg-border/40" aria-hidden="true" />
          )}

          {/* Meta info — category & renewal */}
          {(user.serviceCategory || subscription.currentPeriodEnd) && (
            <div className="flex flex-col gap-2 text-sm">
              {user.serviceCategory && (
                <div className="flex items-center gap-2">
                  <TagIcon
                    className="size-3.5 flex-shrink-0 text-accent/70"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">Kategoria:</span>
                  <span className="font-medium text-foreground">
                    {user.serviceCategory}
                  </span>
                </div>
              )}
              {subscription.currentPeriodEnd && (
                <div className="flex items-center gap-2">
                  <CalendarIcon
                    className="size-3.5 flex-shrink-0 text-accent/70"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">
                    {subscription.cancelAtPeriodEnd ? 'Wygasa:' : 'Odnowienie:'}
                  </span>
                  <span className="font-medium text-foreground">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      'pl-PL',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Manage subscription dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-fit">
                <MoreHorizontalIcon data-icon="inline-start" /> Zarządzaj subskrypcją
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setView('wizard-change-plan')}>
                <RepeatIcon /> Zmień plan…
              </DropdownMenuItem>
              {isSinglePlan && (
                <DropdownMenuItem onClick={() => setView('wizard-change-category')}>
                  <TagIcon /> Zmień kategorię…
                </DropdownMenuItem>
              )}
              {!isBeta && (
                <DropdownMenuItem
                  onClick={() => {
                    startTransition(async () => {
                      const r = await createBillingPortalSession(
                        user.id,
                        window.location.href,
                      )
                      if (r.success && r.url) window.open(r.url, '_blank')
                      else
                        toast.error(
                          r.message || 'Nie można otworzyć portalu rozliczeniowego.',
                        )
                    })
                  }}
                >
                  {isPending && <Spinner data-icon="inline-start" />}
                  <SettingsIcon /> Zarządzaj płatnościami…
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
