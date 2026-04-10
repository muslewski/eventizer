'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangleIcon, ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon, SettingsIcon, TagIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { PlanCard } from '@/components/panel/plan-subskrypcji/PlanCard'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { activateBetaAccess } from '@/actions/stripe/activateBetaAccess'
import type { User, SubscriptionPlan, ServiceCategory } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

type ManagerView = 'status' | 'onboarding-category' | 'onboarding-plan'

interface SubscriptionManagerProps {
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  plans: SubscriptionPlan[]
  lang: string
  showBetaOption: boolean
}

function deriveInitialView(user: User, subscription: CurrentSubscriptionDetails): ManagerView {
  // Service provider with active subscription → show status
  if (user.role === 'service-provider' && subscription.hasSubscription) {
    return 'status'
  }
  // Service provider with no subscription → expired state (rendered via status view)
  if (user.role === 'service-provider' && !subscription.hasSubscription) {
    return 'status'
  }
  // Client or no subscription → start onboarding
  return 'onboarding-category'
}

export function SubscriptionManager({
  user,
  subscription,
  categories,
  plans,
  lang,
  showBetaOption,
}: SubscriptionManagerProps) {
  const router = useRouter()
  const [view, setView] = React.useState<ManagerView>(() => deriveInitialView(user, subscription))
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    user.serviceCategory ?? '',
  )
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(
    subscription.currentPlan ?? null,
  )
  const [isPending, startTransition] = React.useTransition()

  // ---- helpers ----
  const categoryNames = selectedCategory ? selectedCategory.split(' > ') : []
  const categorySlugs = selectedCategory
    ? selectedCategory
        .split(' > ')
        .map((n) => n.toLowerCase().replace(/\s+/g, '-'))
    : []

  const stepNumber: number = view === 'onboarding-category' ? 1 : 2
  const isOnboarding = view === 'onboarding-category' || view === 'onboarding-plan'

  // ---- checkout ----
  function handleCheckout(plan: SubscriptionPlan) {
    const priceId = (plan as any).stripePriceId ?? plan.stripeID
    if (!priceId) {
      toast.error('Wybrany plan nie ma przypisanego identyfikatora ceny Stripe.')
      return
    }

    startTransition(async () => {
      try {
        const result = await createCheckoutSession({
          priceId,
          userId: user.id,
          successUrl: `/${lang}/panel/plan-subskrypcji?success=1`,
          cancelUrl: `/${lang}/panel/plan-subskrypcji`,
          categoryNames,
          categorySlugs,
          userEmail: user.email,
        })

        if (result.url) {
          router.push(result.url)
        } else {
          toast.error('Nie udało się utworzyć sesji płatności.')
        }
      } catch {
        toast.error('Wystąpił błąd podczas tworzenia sesji płatności.')
      }
    })
  }

  // ---- beta ----
  function handleBetaActivate() {
    startTransition(async () => {
      try {
        const result = await activateBetaAccess({
          userId: user.id,
          categoryNames,
          categorySlugs,
        })

        if (result.success) {
          toast.success('Dostęp beta został aktywowany!')
          router.refresh()
        } else {
          toast.error(result.error ?? 'Nie udało się aktywować dostępu beta.')
        }
      } catch {
        toast.error('Wystąpił błąd podczas aktywacji dostępu beta.')
      }
    })
  }

  // ---- renewal (expired state) ----
  function handleRenew() {
    setSelectedCategory(user.serviceCategory ?? '')
    setSelectedPlan(null)
    setView('onboarding-category')
  }

  // ========== ONBOARDING VIEWS ==========
  if (isOnboarding) {
    return (
      <div className="flex flex-col gap-6">
        {/* Step progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Krok {stepNumber} z 2</span>
            <span>{view === 'onboarding-category' ? 'Wybierz kategorię' : 'Wybierz plan'}</span>
          </div>
          <Progress value={stepNumber === 1 ? 50 : 100} />
        </div>

        {/* Step 1: Category */}
        {view === 'onboarding-category' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz swoją kategorię usług</h2>
              <p className="text-sm text-muted-foreground">
                Określ, jakiego rodzaju usługi świadczysz. Możesz to zmienić później.
              </p>
            </div>

            <CategoryPicker
              categories={categories as any}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />

            <div className="flex justify-end">
              <Button
                disabled={!selectedCategory || isPending}
                onClick={() => setView('onboarding-plan')}
              >
                Dalej
                <ChevronRightIcon className="size-4" data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Plan */}
        {view === 'onboarding-plan' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz plan subskrypcji</h2>
              <p className="text-sm text-muted-foreground">
                Wybierz plan najlepiej dopasowany do Twoich potrzeb.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan?.id === plan.id}
                  onSelect={(p) => setSelectedPlan(p)}
                  isCurrentPlan={subscription.currentPlan?.id === plan.id}
                />
              ))}
            </div>

            {showBetaOption && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Tryb beta</p>
                <p className="mt-1">
                  Aktywuj bezpłatny dostęp beta bez Stripe i zacznij korzystać z platformy już teraz.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={!selectedCategory || isPending}
                  onClick={handleBetaActivate}
                >
                  {isPending && <Spinner className="size-4" data-icon="inline-start" />}
                  Aktywuj dostęp beta
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView('onboarding-category')}
              >
                <ChevronLeftIcon className="size-4" data-icon="inline-start" />
                Wstecz
              </Button>

              <Button
                disabled={!selectedPlan || isPending}
                onClick={() => selectedPlan && handleCheckout(selectedPlan)}
              >
                {isPending && <Spinner className="size-4" data-icon="inline-start" />}
                Przejdź do płatności
                <ChevronRightIcon className="size-4" data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ========== STATUS VIEW ==========
  const isExpired = user.role === 'service-provider' && !subscription.hasSubscription
  const isActive = user.role === 'service-provider' && subscription.hasSubscription

  return (
    <div className="flex flex-col gap-6">
      {/* EXPIRED */}
      {isExpired && (
        <>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Subskrypcja wygasła</AlertTitle>
            <AlertDescription>
              Twoja subskrypcja wygasła. Twoje oferty zostały wycofane z publikacji.
            </AlertDescription>
          </Alert>

          <Button onClick={handleRenew} className="w-fit">
            <RefreshCwIcon className="size-4" data-icon="inline-start" />
            Odnów subskrypcję
          </Button>
        </>
      )}

      {/* ACTIVE */}
      {isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-bebas text-2xl tracking-wide">
                {subscription.isBetaUser
                  ? 'Plan Beta'
                  : (subscription.currentPlan?.name ?? 'Aktywna subskrypcja')}
              </CardTitle>
              <Badge variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}>
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
            <CardDescription>
              {user.serviceCategory && (
                <span>Kategoria: {user.serviceCategory}</span>
              )}
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

            {subscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertTriangleIcon />
                <AlertTitle>Subskrypcja zostanie anulowana</AlertTitle>
                <AlertDescription>
                  Twoja subskrypcja nie zostanie automatycznie odnowiona.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              {!subscription.isBetaUser && (
                <Button
                  disabled={isPending}
                  onClick={() => {
                    setSelectedPlan(subscription.currentPlan ?? null)
                    setView('onboarding-plan')
                  }}
                >
                  <RefreshCwIcon className="size-4" data-icon="inline-start" />
                  Zmień plan
                </Button>
              )}

              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setSelectedCategory(user.serviceCategory ?? '')
                  setView('onboarding-category')
                }}
              >
                <TagIcon className="size-4" data-icon="inline-start" />
                Zmień kategorię
              </Button>

              {!subscription.isBetaUser && (
                <Button variant="outline" asChild>
                  <a href="/app/account" target="_blank" rel="noopener noreferrer">
                    <SettingsIcon className="size-4" data-icon="inline-start" />
                    Zarządzaj płatnościami
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
