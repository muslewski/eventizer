'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  SettingsIcon,
  TagIcon,
  RepeatIcon,
  MoreHorizontalIcon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { SubscriptionWizard } from './SubscriptionWizard'
import { getDisplayPlanName } from './lib/getDisplayPlanName'
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
  const isSinglePlan = (subscription.currentPlan?.maxOffers ?? 1) === 1

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
        <Card className="bg-background border-border/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-bebas text-2xl tracking-wide">
                {subscription.isBetaUser
                  ? 'Plan Beta'
                  : getDisplayPlanName(subscription.currentPlan) || 'Aktywna subskrypcja'}
              </CardTitle>
              <Badge
                variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}
              >
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
            <CardDescription>
              {user.serviceCategory && <span>Kategoria: {user.serviceCategory}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Odnowienie'}:{' '}
                <span className="font-medium text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            )}
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
                {!subscription.isBetaUser && (
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
