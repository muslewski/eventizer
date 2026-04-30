'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  SettingsIcon,
  TagIcon,
  CheckIcon,
  SparklesIcon,
  UserIcon,
  Building2Icon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { PlanModeCard } from '@/components/panel/plan-subskrypcji/PlanModeCard'
import { PlanPickerCard } from '@/components/panel/plan-subskrypcji/PlanPickerCard'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { activateBetaAccess } from '@/actions/stripe/activateBetaAccess'
import { createBillingPortalSession } from '@/actions/stripe/manageSubscription'
import { getStripePrices, type StripePriceDetails } from '@/actions/stripe/products/getStripePrices'
import type { PlanPriceSummary } from '@/actions/stripe/products/getPlanPriceSummary'
import { cn } from '@/lib/utils'
import type { User, SubscriptionPlan, ServiceCategory } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

const BETA_PRICE_ID = 'BETA'

type ManagerView =
  | 'status'
  | 'onboarding-mode'
  | 'onboarding-plan'
  | 'onboarding-category'
  | 'onboarding-price'

type Mode = 'single' | 'multi'

interface SubscriptionManagerProps {
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  multiPlans: SubscriptionPlan[]
  planSummaries: Record<string, PlanPriceSummary>
  lang: string
  showBetaOption: boolean
}

function deriveInitialView(user: User): ManagerView {
  if (user.role === 'service-provider') return 'status'
  return 'onboarding-mode'
}

/**
 * Walks the category tree along a path string and pulls out everything the
 * wizard needs from a single traversal: the breadcrumb names, the slugs,
 * and the deepest `requiredPlan` reference.
 *
 * Accepts two path formats:
 *   - Modern slug-path emitted by CategoryPicker:  "muzyka/dj/dj-weselny"
 *   - Legacy name-path stored on existing users:   "Muzyka > DJ > DJ Weselny"
 *
 * The previous helper assumed name-path and split on " > "; that broke
 * for slug-paths because a slug-path like "muzyka/dj/dj-weselny" doesn't
 * contain " > ", so it became a single-element array of garbage. The
 * Single-mode `requiredPlan` lookup returned null, which collapsed the
 * interval-picker step to just the Beta option.
 */
function walkCategoryPath(
  categories: ServiceCategory[],
  path: string,
): { names: string[]; slugs: string[]; requiredPlan: SubscriptionPlan | null } {
  if (!path) return { names: [], slugs: [], requiredPlan: null }

  const usesSlugPath = path.includes('/')
  const parts = usesSlugPath ? path.split('/') : path.split(' > ')

  const names: string[] = []
  const slugs: string[] = []
  let requiredPlan: SubscriptionPlan | null = null
  let currentItems: ServiceCategory[] = categories

  for (const part of parts) {
    const found = currentItems.find((c) =>
      usesSlugPath ? c.slug === part : c.name === part,
    ) as any
    if (!found) break

    names.push(found.name)
    slugs.push(found.slug)

    if (found.requiredPlan && typeof found.requiredPlan === 'object') {
      requiredPlan = found.requiredPlan as SubscriptionPlan
    }

    if (found.subcategory_level_1?.length) {
      currentItems = found.subcategory_level_1
    } else if (found.subcategory_level_2?.length) {
      currentItems = found.subcategory_level_2
    } else {
      break
    }
  }

  return { names, slugs, requiredPlan }
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function getIntervalLabel(interval: string, intervalCount: number): string {
  if (interval === 'month' && intervalCount === 1) return 'Miesięcznie'
  if (interval === 'month' && intervalCount === 6) return 'Co 6 miesięcy'
  if (interval === 'year' && intervalCount === 1) return 'Rocznie'
  return `Co ${intervalCount} ${interval}`
}

function viewToStep(view: ManagerView): number {
  switch (view) {
    case 'onboarding-mode': return 1
    case 'onboarding-plan':
    case 'onboarding-category': return 2
    case 'onboarding-price': return 3
    default: return 1
  }
}

const TOTAL_STEPS = 3

export function SubscriptionManager({
  user,
  subscription,
  categories,
  multiPlans,
  planSummaries,
  lang,
  showBetaOption,
}: SubscriptionManagerProps) {
  const router = useRouter()
  const [view, setView] = React.useState<ManagerView>(() => deriveInitialView(user))
  const [mode, setMode] = React.useState<Mode | null>(null)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState<string>(user.serviceCategory ?? '')
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [availablePrices, setAvailablePrices] = React.useState<StripePriceDetails[]>([])
  const [isPricesLoading, setIsPricesLoading] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Walk the chosen category path once to derive everything dependent on it.
  // Memoize so the active-plan computation doesn't re-walk on every render.
  const { categoryNames, categorySlugs, requiredPlan } = React.useMemo(() => {
    const { names, slugs, requiredPlan } = walkCategoryPath(categories, selectedCategory)
    return { categoryNames: names, categorySlugs: slugs, requiredPlan }
  }, [categories, selectedCategory])

  // Resolve the active plan + product depending on mode
  const activePlan: SubscriptionPlan | null = mode === 'multi' ? selectedPlan : requiredPlan
  const stripeProductId = activePlan?.stripeID ?? null

  // Fetch Stripe prices when arriving at the price step
  React.useEffect(() => {
    if (!stripeProductId || view !== 'onboarding-price') {
      setAvailablePrices([])
      setSelectedPriceId(null)
      return
    }

    let cancelled = false
    setIsPricesLoading(true)

    getStripePrices(stripeProductId).then((result) => {
      if (cancelled) return
      if (result.success) {
        const sorted = [...result.prices].sort((a, b) => {
          const aMonths = a.recurring?.interval === 'year' ? a.recurring.intervalCount * 12 : (a.recurring?.intervalCount ?? 1)
          const bMonths = b.recurring?.interval === 'year' ? b.recurring.intervalCount * 12 : (b.recurring?.intervalCount ?? 1)
          return aMonths - bMonths
        })
        setAvailablePrices(sorted)
        if (sorted.length === 1) setSelectedPriceId(sorted[0].id)
      } else {
        toast.error('Nie udało się pobrać dostępnych cen.')
      }
      setIsPricesLoading(false)
    })

    return () => { cancelled = true }
  }, [stripeProductId, view])

  const stepNumber = viewToStep(view)
  const isOnboarding = view !== 'status'
  const progressValue = (stepNumber / TOTAL_STEPS) * 100

  const stepHeading = (() => {
    switch (view) {
      case 'onboarding-mode': return 'Wybierz typ konta'
      case 'onboarding-plan': return 'Wybierz plan'
      case 'onboarding-category': return 'Wybierz kategorię'
      case 'onboarding-price': return 'Wybierz okres rozliczeniowy'
      default: return ''
    }
  })()

  function handleCheckout() {
    if (!selectedPriceId || !activePlan) return

    startTransition(async () => {
      try {
        if (selectedPriceId === BETA_PRICE_ID) {
          const result = await activateBetaAccess({
            userId: user.id,
            categoryNames,
            categorySlugs,
            maxOffers: activePlan.maxOffers ?? 1,
          })
          if (result.success) {
            toast.success('Dostęp beta został aktywowany!')
            window.location.href = `/${lang}/panel/dashboard?checkout=success`
          } else {
            toast.error(result.error ?? 'Nie udało się aktywować dostępu beta.')
          }
          return
        }

        const result = await createCheckoutSession({
          priceId: selectedPriceId,
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

  function handleRenew() {
    setMode(null)
    setSelectedPlan(null)
    setSelectedCategory(user.serviceCategory ?? '')
    setSelectedPriceId(null)
    setView('onboarding-mode')
  }

  // ============ ONBOARDING VIEWS ============
  if (isOnboarding) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Krok {stepNumber} z {TOTAL_STEPS}</span>
            <span>{stepHeading}</span>
          </div>
          <Progress value={progressValue} />
        </div>

        {view === 'onboarding-mode' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Ile ofert chcesz publikować?</h2>
              <p className="text-sm text-muted-foreground">
                Wybierz typ konta dopasowany do Twojej działalności.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PlanModeCard
                title="Jedno ogłoszenie wystarczy"
                description="Świadczę jedną główną usługę (np. tylko jako DJ albo tylko catering). Idealne, jeśli skupiasz się na jednej specjalizacji."
                icon={<UserIcon className="size-7" />}
                selected={mode === 'single'}
                onSelect={() => {
                  setMode('single')
                  setSelectedPlan(null)
                  setView('onboarding-category')
                }}
              />
              <PlanModeCard
                title="Więcej ofert"
                description="Świadczę kilka różnych usług (np. DJ + catering, fotograf + dekoracje). Najczęściej wybierane przez agencje i firmy oferujące wiele specjalizacji jednocześnie."
                icon={<Building2Icon className="size-7" />}
                selected={mode === 'multi'}
                onSelect={() => {
                  setMode('multi')
                  setSelectedCategory('')
                  setView('onboarding-plan')
                }}
              />
            </div>
          </div>
        )}

        {view === 'onboarding-plan' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz plan</h2>
              <p className="text-sm text-muted-foreground">
                Wszystkie kategorie usług są dostępne w obu planach.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {multiPlans.map((plan) => (
                <PlanPickerCard
                  key={plan.id}
                  plan={plan}
                  priceSummary={planSummaries[plan.id] ?? { monthly: null, yearly: null }}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={() => {
                    setSelectedPlan(plan)
                    setView('onboarding-price')
                  }}
                />
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView('onboarding-mode')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>
            </div>
          </div>
        )}

        {view === 'onboarding-category' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz swoją kategorię usług</h2>
              <p className="text-sm text-muted-foreground">
                Określ, jakiego rodzaju usługi świadczysz. Od wybranej kategorii zależy plan subskrypcji.
              </p>
            </div>

            <CategoryPicker
              categories={categories as any}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView('onboarding-mode')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>
              <Button
                disabled={!selectedCategory || isPending}
                onClick={() => setView('onboarding-price')}
              >
                Dalej
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {view === 'onboarding-price' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz okres rozliczeniowy</h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'single' && (
                  <>
                    Kategoria: <span className="font-medium text-foreground">{selectedCategory}</span>
                    {activePlan && (
                      <> — Plan: <span className="font-medium text-foreground">{activePlan.name}</span></>
                    )}
                  </>
                )}
                {mode === 'multi' && activePlan && (
                  <>
                    Plan: <span className="font-medium text-foreground">{activePlan.name}</span>
                    {' '}— do {activePlan.maxOffers ?? 1} ofert
                  </>
                )}
              </p>
            </div>

            {isPricesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {availablePrices.map((price) => {
                  const isSelected = selectedPriceId === price.id
                  const label = getIntervalLabel(
                    price.recurring?.interval ?? 'month',
                    price.recurring?.intervalCount ?? 1,
                  )
                  const formattedPrice = formatPrice(price.unitAmount ?? 0, price.currency)

                  return (
                    <button
                      key={price.id}
                      type="button"
                      onClick={() => setSelectedPriceId(price.id)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30',
                        )}>
                          {isSelected && <CheckIcon className="size-3" />}
                        </div>
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className="font-bebas text-xl tracking-wide">{formattedPrice}</span>
                    </button>
                  )
                })}

                {showBetaOption && (
                  <button
                    type="button"
                    onClick={() => setSelectedPriceId(BETA_PRICE_ID)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left transition-colors',
                      selectedPriceId === BETA_PRICE_ID
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/30',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex size-5 items-center justify-center rounded-full border',
                        selectedPriceId === BETA_PRICE_ID ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30',
                      )}>
                        {selectedPriceId === BETA_PRICE_ID && <CheckIcon className="size-3" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="size-4 text-accent" />
                        <span className="font-medium">Dostęp Beta</span>
                        <Badge variant="outline" className="text-accent border-accent/30">Za darmo</Badge>
                      </div>
                    </div>
                    <span className="font-bebas text-xl tracking-wide text-accent">0 PLN</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView(mode === 'multi' ? 'onboarding-plan' : 'onboarding-category')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>

              <Button
                disabled={!selectedPriceId || isPending}
                onClick={handleCheckout}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                {selectedPriceId === BETA_PRICE_ID ? 'Aktywuj dostęp beta' : 'Przejdź do płatności'}
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ STATUS VIEW ============
  const isExpired = user.role === 'service-provider' && !subscription.hasSubscription
  const isActive = user.role === 'service-provider' && subscription.hasSubscription
  const isMultiClass = (subscription.currentPlan?.maxOffers ?? 1) > 1

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

          <Button onClick={handleRenew} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" />
            Odnów subskrypcję
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
                  : (subscription.currentPlan?.name ?? 'Aktywna subskrypcja')}
              </CardTitle>
              <Badge variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}>
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
            {user.serviceCategory && (
              <CardDescription>
                <span>Kategoria: {user.serviceCategory}</span>
              </CardDescription>
            )}
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
              {!isMultiClass && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setMode('single')
                    setSelectedCategory(user.serviceCategory ?? '')
                    setView('onboarding-category')
                  }}
                >
                  <TagIcon data-icon="inline-start" />
                  Zmień kategorię
                </Button>
              )}

              {!subscription.isBetaUser && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await createBillingPortalSession(user.id, window.location.href)
                      if (result.success && result.url) {
                        window.open(result.url, '_blank')
                      } else {
                        toast.error(result.message || 'Nie można otworzyć portalu rozliczeniowego.')
                      }
                    })
                  }}
                >
                  {isPending && <Spinner data-icon="inline-start" />}
                  <SettingsIcon data-icon="inline-start" />
                  Zarządzaj płatnościami
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
